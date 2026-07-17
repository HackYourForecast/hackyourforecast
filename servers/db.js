const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
let pool = null;

if (DATABASE_URL) {
  const useSsl = process.env.PGSSL !== "disable";
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false
  });
}

async function initDb() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS weather_cache (
      source_api TEXT NOT NULL,
      geohash5 TEXT NOT NULL,
      geohash3 TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      symbol TEXT,
      from_hour BIGINT NOT NULL,
      updated_timestamp BIGINT,
      temperature_c DOUBLE PRECISION,
      pressure_hpa DOUBLE PRECISION,
      wind_speed_mps DOUBLE PRECISION,
      humidity_percent DOUBLE PRECISION,
      PRIMARY KEY (source_api, geohash5, from_hour)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS weather_cache_geohash3_idx
    ON weather_cache (geohash3, from_hour DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS stats_hourly (
      run_timestamp BIGINT NOT NULL,
      source_api TEXT NOT NULL,
      count_of_items INTEGER NOT NULL,
      sum_of_temp_c DOUBLE PRECISION NOT NULL,
      sum_of_wind_mps DOUBLE PRECISION NOT NULL,
      sum_of_pressure_hpa DOUBLE PRECISION NOT NULL,
      last_update_timestamp BIGINT NOT NULL,
      sum_of_temp_c_diff DOUBLE PRECISION NOT NULL DEFAULT 0,
      temp_diff_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (source_api, run_timestamp)
    );
  `);
}

async function upsertWeatherRows(rows) {
  if (!pool || !rows.length) return 0;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const row of rows) {
      await client.query(
        `
        INSERT INTO weather_cache (
          source_api, geohash5, geohash3, lat, lng, symbol, from_hour,
          updated_timestamp, temperature_c, pressure_hpa, wind_speed_mps, humidity_percent
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
        )
        ON CONFLICT (source_api, geohash5, from_hour)
        DO UPDATE SET
          geohash3 = EXCLUDED.geohash3,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          symbol = EXCLUDED.symbol,
          updated_timestamp = EXCLUDED.updated_timestamp,
          temperature_c = EXCLUDED.temperature_c,
          pressure_hpa = EXCLUDED.pressure_hpa,
          wind_speed_mps = EXCLUDED.wind_speed_mps,
          humidity_percent = EXCLUDED.humidity_percent
      `,
        [
          row.sourceApi,
          row.geohash5,
          row.geohash3,
          row.lat,
          row.lng,
          row.symbol,
          row.fromHour,
          row.updatedTimestamp,
          row.temperatureC,
          row.pressureHPA,
          row.windSpeedMps,
          row.humidityPercent
        ]
      );
    }
    await client.query("COMMIT");
    return rows.length;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function rebuildStatsForHour(runTimestamp) {
  if (!pool) return;

  await pool.query(
    `
    INSERT INTO stats_hourly (
      run_timestamp, source_api, count_of_items, sum_of_temp_c, sum_of_wind_mps,
      sum_of_pressure_hpa, last_update_timestamp, sum_of_temp_c_diff, temp_diff_count
    )
    SELECT
      $1 AS run_timestamp,
      source_api,
      COUNT(*)::int AS count_of_items,
      COALESCE(SUM(temperature_c), 0) AS sum_of_temp_c,
      COALESCE(SUM(wind_speed_mps), 0) AS sum_of_wind_mps,
      COALESCE(SUM(pressure_hpa), 0) AS sum_of_pressure_hpa,
      COALESCE(MAX(updated_timestamp), $1) AS last_update_timestamp,
      0 AS sum_of_temp_c_diff,
      0 AS temp_diff_count
    FROM weather_cache
    WHERE from_hour = $1
    GROUP BY source_api
    ON CONFLICT (source_api, run_timestamp)
    DO UPDATE SET
      count_of_items = EXCLUDED.count_of_items,
      sum_of_temp_c = EXCLUDED.sum_of_temp_c,
      sum_of_wind_mps = EXCLUDED.sum_of_wind_mps,
      sum_of_pressure_hpa = EXCLUDED.sum_of_pressure_hpa,
      last_update_timestamp = EXCLUDED.last_update_timestamp
  `,
    [runTimestamp]
  );
}

async function trimOldData(retentionHours = 72) {
  if (!pool) return;
  const cutoff = Math.floor(Date.now() / 1000 / 3600) * 3600 - retentionHours * 3600;
  await pool.query(`DELETE FROM weather_cache WHERE from_hour < $1`, [cutoff]);
  await pool.query(`DELETE FROM stats_hourly WHERE run_timestamp < $1`, [cutoff]);
}

function hasDatabase() {
  return Boolean(pool);
}

async function query(sql, params = []) {
  if (!pool) throw new Error("DATABASE_URL is not configured");
  return pool.query(sql, params);
}

module.exports = {
  hasDatabase,
  initDb,
  query,
  upsertWeatherRows,
  rebuildStatsForHour,
  trimOldData
};
