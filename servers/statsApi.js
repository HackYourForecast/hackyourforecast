const Express = require("express");
const {
  sourceApis: SOURCE_APIS,
  statsBySource,
  total
} = require("./snapshotStore");
const { hasDatabase, query } = require("./db");

const app = Express();

function mapStatRow(row) {
  return {
    runTimeStamp: Number(row.run_timestamp),
    countOfItems: Number(row.count_of_items),
    sumOfTempC: Number(row.sum_of_temp_c),
    sumOfWindMps: Number(row.sum_of_wind_mps),
    sumOfPressureHPA: Number(row.sum_of_pressure_hpa),
    lastUpdateTimestamp: Number(row.last_update_timestamp),
    sumOfTempCDiff: Number(row.sum_of_temp_c_diff || 0),
    tempDiffCount: Number(row.temp_diff_count || 0)
  };
}

app.get("/api/stats/list", async (req, res, next) => {
  try {
    if (hasDatabase()) {
      const rows = (
        await query(`SELECT DISTINCT source_api FROM stats_hourly ORDER BY source_api ASC`)
      ).rows;
      const sources = rows.map(row => row.source_api);
      if (sources.length > 0) return res.json({ sources });
    }

    if (SOURCE_APIS) return res.json({ sources: SOURCE_APIS });
    return next(new Error("Error getting sources list..."));
  } catch (error) {
    return next(error);
  }
});

app.get("/api/stats/total", async (req, res, next) => {
  try {
    if (hasDatabase()) {
      const rows = (
        await query(
          `
          SELECT
            run_timestamp,
            SUM(count_of_items) AS count_of_items,
            SUM(sum_of_temp_c) AS sum_of_temp_c,
            SUM(sum_of_wind_mps) AS sum_of_wind_mps,
            SUM(sum_of_pressure_hpa) AS sum_of_pressure_hpa,
            MAX(last_update_timestamp) AS last_update_timestamp,
            SUM(sum_of_temp_c_diff) AS sum_of_temp_c_diff,
            SUM(temp_diff_count) AS temp_diff_count
          FROM stats_hourly
          GROUP BY run_timestamp
          ORDER BY run_timestamp DESC
          LIMIT 240
        `
        )
      ).rows;
      if (rows.length > 0) return res.json(rows.map(mapStatRow));
    }

    if (total.length === 0) return next(new Error("No data available for this request..."));
    return res.json(total);
  } catch (error) {
    return next(error);
  }
});

app.get("/api/stats/:sourceApi", async (req, res, next) => {
  const sourceApi = req.params.sourceApi.toLowerCase();
  try {
    if (sourceApi === "total") {
      if (hasDatabase()) {
        const rows = (
          await query(
            `
            SELECT
              run_timestamp,
              SUM(count_of_items) AS count_of_items,
              SUM(sum_of_temp_c) AS sum_of_temp_c,
              SUM(sum_of_wind_mps) AS sum_of_wind_mps,
              SUM(sum_of_pressure_hpa) AS sum_of_pressure_hpa,
              MAX(last_update_timestamp) AS last_update_timestamp,
              SUM(sum_of_temp_c_diff) AS sum_of_temp_c_diff,
              SUM(temp_diff_count) AS temp_diff_count
            FROM stats_hourly
            GROUP BY run_timestamp
            ORDER BY run_timestamp DESC
            LIMIT 240
          `
          )
        ).rows;
        if (rows.length > 0) return res.json(rows.map(mapStatRow));
      }
      if (total.length === 0) return next(new Error("No data available for this request..."));
      return res.json(total);
    }

    if (hasDatabase()) {
      const rows = (
        await query(
          `
          SELECT
            run_timestamp,
            count_of_items,
            sum_of_temp_c,
            sum_of_wind_mps,
            sum_of_pressure_hpa,
            last_update_timestamp,
            sum_of_temp_c_diff,
            temp_diff_count
          FROM stats_hourly
          WHERE source_api = $1
          ORDER BY run_timestamp DESC
          LIMIT 240
        `,
          [sourceApi]
        )
      ).rows;
      if (rows.length > 0) return res.json(rows.map(mapStatRow));
    }

    if (SOURCE_APIS.find(elem => elem.toLowerCase() === sourceApi)) {
      const results = statsBySource[sourceApi] || [];
      if (results.length === 0) return next(new Error("No data available for this request..."));
      return res.json(results);
    }

    return res.status(404).json({ error: `source API ${sourceApi} not found` });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/stats/", async (req, res, next) => {
  try {
    if (hasDatabase()) {
      const rows = (
        await query(
          `
          SELECT
            source_api,
            run_timestamp,
            count_of_items,
            sum_of_temp_c,
            sum_of_wind_mps,
            sum_of_pressure_hpa,
            last_update_timestamp,
            sum_of_temp_c_diff,
            temp_diff_count
          FROM stats_hourly
          ORDER BY run_timestamp DESC
          LIMIT 2000
        `
        )
      ).rows;
      if (rows.length > 0) {
        const groupedResult = {};
        rows.forEach(row => {
          if (!groupedResult[row.source_api]) groupedResult[row.source_api] = [];
          groupedResult[row.source_api].push(mapStatRow(row));
        });
        return res.json(groupedResult);
      }
    }

    if (SOURCE_APIS.length === 0) return next(new Error("No data available for this request..."));

    const groupedResult = {};
    SOURCE_APIS.forEach(source => {
      groupedResult[source] = statsBySource[source] || [];
    });
    return res.json(groupedResult);
  } catch (error) {
    return next(error);
  }
});

app.use((error, req, res, next) => {
  res.status(500).json({ response: error.message });
});

module.exports = app;
