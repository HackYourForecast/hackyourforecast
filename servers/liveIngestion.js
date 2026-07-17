const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cron = require("node-cron");
const geoHash = require("latlon-geohash");
const {
  hasDatabase,
  initDb,
  upsertWeatherRows,
  rebuildStatsForHour,
  trimOldData
} = require("./db");

const SOURCE_API = "metno";
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

async function fetchMetnoForCity(city, userAgent) {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${encodeURIComponent(
    city.lat
  )}&lon=${encodeURIComponent(city.lng)}`;

  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent": userAgent,
      Accept: "application/json"
    }
  });

  const timeseries = response.data?.properties?.timeseries || [];
  if (!timeseries.length) return null;

  const nowHour = toHourTimestamp();
  const point =
    timeseries.find(entry => toHourTimestamp(new Date(entry.time).getTime() / 1000) >= nowHour) ||
    timeseries[0];

  const hourTs = toHourTimestamp(new Date(point.time).getTime() / 1000);
  const details = point?.data?.instant?.details || {};
  const symbol =
    point?.data?.next_1_hours?.summary?.symbol_code ||
    point?.data?.next_6_hours?.summary?.symbol_code ||
    point?.data?.next_12_hours?.summary?.symbol_code ||
    null;

  const lat = Number(city.lat);
  const lng = Number(city.lng);

  return {
    sourceApi: SOURCE_API,
    geohash5: geoHash.encode(lat, lng, 5),
    geohash3: geoHash.encode(lat, lng, 3),
    lat,
    lng,
    symbol,
    fromHour: hourTs,
    updatedTimestamp: toHourTimestamp(),
    temperatureC: Number(details.air_temperature ?? null),
    pressureHPA: Number(details.air_pressure_at_sea_level ?? null),
    windSpeedMps: Number(details.wind_speed ?? null),
    humidityPercent: Number(details.relative_humidity ?? null)
  };
}

async function runIngestionOnce() {
  if (!hasDatabase()) return { skipped: true, reason: "DATABASE_URL missing" };

  const userAgent = process.env.METNO_USER_AGENT;
  if (!userAgent) {
    return { skipped: true, reason: "METNO_USER_AGENT missing" };
  }

  await initDb();

  const cities = loadCities();
  const rows = [];
  let errors = 0;

  for (const city of cities) {
    try {
      const row = await fetchMetnoForCity(city, userAgent);
      if (row) rows.push(row);
    } catch (error) {
      errors += 1;
      console.warn(`met.no fetch failed for ${city.name || "unknown city"}: ${error.message}`);
    }
  }

  const inserted = await upsertWeatherRows(rows);
  const runTs = toHourTimestamp();
  await rebuildStatsForHour(runTs);
  await trimOldData(Number(process.env.HYF_RETENTION_HOURS || 72));

  return { skipped: false, cities: cities.length, inserted, errors, runTs };
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

  // Run hourly by default (minute 5), configurable with HYF_CRON_SCHEDULE.
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
