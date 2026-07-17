const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const {
  hasDatabase,
  initDb,
  upsertWeatherRows,
  rebuildStatsForHour,
  trimOldData
} = require("./db");
const { getEnabledProviders } = require("./providers");

const CITIES_PATH = path.join(__dirname, "..", "citiesFolder", "citiesToDisplay.json");

function toHourTimestamp(unixSeconds = Date.now() / 1000) {
  return Math.floor(unixSeconds / 3600) * 3600;
}

function loadCities() {
  const raw = JSON.parse(fs.readFileSync(CITIES_PATH, "utf8"));
  const limit = Number(process.env.HYF_CITY_LIMIT || 0);
  if (Number.isFinite(limit) && limit > 0) return raw.slice(0, limit);
  return raw;
}

function getMissingEnvForProvider(provider, env = process.env) {
  const required = Array.isArray(provider.requiredEnv) ? provider.requiredEnv : [];
  return required.filter(key => !env[key]);
}

async function fetchRowsForProvider(provider, cities, context) {
  const concurrency = Math.max(1, Number(process.env.HYF_FETCH_CONCURRENCY || 6));
  const rows = [];
  let errors = 0;

  let index = 0;
  async function worker() {
    while (index < cities.length) {
      const i = index;
      index += 1;
      const city = cities[i];
      try {
        const row = await provider.fetchForecastForCity(city, context);
        if (row) rows.push(row);
      } catch (error) {
        errors += 1;
        console.warn(
          `[ingestion:${provider.id}] fetch failed for ${city?.name || "unknown city"}: ${error.message}`
        );
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, cities.length) }, () => worker());
  await Promise.all(workers);
  return { rows, errors };
}

async function runIngestionOnce() {
  if (!hasDatabase()) return { skipped: true, reason: "DATABASE_URL missing" };

  await initDb();

  const cities = loadCities();
  const context = { env: process.env, nowHour: toHourTimestamp() };
  const { providers, missing } = getEnabledProviders(process.env);

  if (providers.length === 0) {
    return {
      skipped: true,
      reason: missing.length
        ? `No valid providers enabled. Unknown ids: ${missing.join(",")}`
        : "No providers enabled"
    };
  }

  const rows = [];
  let errors = 0;
  const providerSummary = {};

  for (const provider of providers) {
    const missingEnv = getMissingEnvForProvider(provider, process.env);
    if (missingEnv.length > 0) {
      providerSummary[provider.id] = {
        skipped: true,
        reason: `Missing env: ${missingEnv.join(",")}`,
        rows: 0,
        errors: 0
      };
      continue;
    }

    const fetched = await fetchRowsForProvider(provider, cities, context);
    rows.push(...fetched.rows);
    errors += fetched.errors;
    providerSummary[provider.id] = {
      skipped: false,
      rows: fetched.rows.length,
      errors: fetched.errors
    };
  }

  const inserted = await upsertWeatherRows(rows);
  const runTs = toHourTimestamp();
  await rebuildStatsForHour(runTs);
  await trimOldData(Number(process.env.HYF_RETENTION_HOURS || 72));

  return {
    skipped: false,
    cities: cities.length,
    providers: providerSummary,
    inserted,
    errors,
    runTs
  };
}

function startIngestionScheduler() {
  if (!hasDatabase()) {
    console.log("[ingestion] DATABASE_URL not configured, running in snapshot-only mode");
    return;
  }

  if (String(process.env.HYF_DISABLE_CRON || "").toLowerCase() === "true") {
    console.log("[ingestion] scheduler disabled via HYF_DISABLE_CRON=true");
    return;
  }

  const schedule = process.env.HYF_CRON_SCHEDULE || "5 */2 * * *";

  // Warm cache on startup.
  runIngestionOnce()
    .then(result => console.log("[ingestion] startup run:", result))
    .catch(error => console.error("[ingestion] startup failed:", error.message));

  // Run every 2h by default (minute 5), configurable with HYF_CRON_SCHEDULE.
  cron.schedule(schedule, async () => {
    try {
      const result = await runIngestionOnce();
      console.log("[ingestion] scheduled run:", result);
    } catch (error) {
      console.error("[ingestion] scheduled run failed:", error.message);
    }
  });

  console.log(`[ingestion] scheduler active with cron: ${schedule}`);
}

module.exports = {
  startIngestionScheduler,
  runIngestionOnce
};
