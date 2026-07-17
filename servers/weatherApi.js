const Express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const { findBestMatch, toApiResult, snapshotRecords } = require("./snapshotStore");
const { hasDatabase, query } = require("./db");

const app = Express();
app.use(Express.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(morgan("short"));

function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function findDbBestMatch(lat, lng, timestamp) {
  const geoHash = require("latlon-geohash");
  const geohash3 = geoHash.encode(lat, lng, 3);
  const targetHour = Math.floor(timestamp / 3600) * 3600;

  let rows = (
    await query(
      `
      SELECT * FROM weather_cache
      WHERE geohash3 = $1
      AND from_hour BETWEEN $2 - 86400 AND $2 + 86400
      ORDER BY ABS(from_hour - $2) ASC
      LIMIT 200
    `,
      [geohash3, targetHour]
    )
  ).rows;

  if (!rows.length) {
    rows = (
      await query(
        `
        SELECT * FROM weather_cache
        WHERE from_hour BETWEEN $1 - 86400 AND $1 + 86400
        ORDER BY ABS(from_hour - $1) ASC
        LIMIT 1000
      `,
        [targetHour]
      )
    ).rows;
  }

  if (!rows.length) return null;

  const best = rows
    .map(row => ({
      ...row,
      distance: distanceKm(lat, lng, Number(row.lat), Number(row.lng))
    }))
    .sort((a, b) => a.distance - b.distance)[0];

  return {
    weather: {
      geohash5: best.geohash5,
      geohash3: best.geohash3,
      sourceApi: best.source_api,
      symbol: best.symbol,
      fromHour: Number(best.from_hour),
      altitude: null,
      fogPercent: null,
      pressureHPA: Number(best.pressure_hpa),
      cloudinessPercent: null,
      windDirectionDeg: null,
      dewpointTemperatureC: null,
      windGustMps: null,
      humidityPercent: Number(best.humidity_percent),
      areaMaxWindSpeedMps: null,
      windSpeedMps: Number(best.wind_speed_mps),
      temperatureC: Number(best.temperature_c),
      lowCloudsPercent: null,
      mediumCloudsPercent: null,
      highCloudsPercent: null,
      temperatureProbability: null,
      windProbability: null,
      updatedTimestamp: Number(best.updated_timestamp)
    },
    location: {
      lat: Number(best.lat),
      lng: Number(best.lng),
      fromHour: Number(best.from_hour),
      distance: Number(best.distance.toFixed(3))
    }
  };
}

app.post("/api/weather", async (req, res) => {
  const coords = Array.isArray(req.body.locations) ? req.body.locations : [];
  if (coords.length === 0) {
    return res.status(400).json({ error: "locations must be a non-empty array" });
  }

  const result = [];
  for (const coord of coords) {
    try {
      const lat = Number(coord.lat);
      const lng = Number(coord.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        result.push({ error: "Invalid location coordinates", location: coord });
        continue;
      }

      const ts = Number(coord.timestamp || coord.timestam || Date.now() / 1000);
      let match = null;

      if (hasDatabase()) {
        match = await findDbBestMatch(lat, lng, ts);
      }

      if (!match && snapshotRecords.length > 0) {
        const snapMatch = findBestMatch(lat, lng, ts);
        match = snapMatch ? toApiResult(snapMatch) : null;
      }

      if (!match) {
        result.push({ error: "Data not found for this location", location: { lat, lng } });
        continue;
      }

      result.push(match);
    } catch (error) {
      result.push({ error: error.message, location: coord });
    }
  }

  return res.json({ result });
});

app.get("/api/weather/license", (req, res) => {
  const licenses = {
    australia:
      "Based on data from Australia weather agency, License:http://www.bom.gov.au",
    belgium:
      "Based on data from Belgium weather agency, License: http://www.meteo.be",
    europe:
      "Based on data from Belgium weather agency, License: http://www.meteo.be",
    world:
      "Based on data from Belgium weather agency, License: http://www.meteo.be",
    poland:
      "Based on data from Poland weather agency, License: http://www.meteoprog.pl",
    sweden:
      "Based on data from Sweden weather agency, License: https://www.smhi.se",
    slovenia:
      "Based on data from Slovenia weather agency, License: https://meteo.si",
    southKorea:
      "Based on data from South Korea weather agency, License: https://web.kma.go.kr",
    unitedKingdom:
      "Based on data from United Kingdom weather agency, License:https://www.metoffice.gov.uk",
    iceland:
      "Based on data from Iceland weather agency, License: https://icelandmonitor.mbl.is",
    netherlands:
      "Based on data from The Netherlands weather agency, License: https://www.knmi.nl",
    usa:
      "Based on data from United States of America weather agency, License: https://icelandmonitor.mbl.is"
  };
  res.send(licenses);
});

module.exports = app;
