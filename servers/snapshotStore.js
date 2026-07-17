const fs = require("fs");
const path = require("path");
const geoHash = require("latlon-geohash");

const DATA_DIR = path.join(__dirname, "..", "data");

function safeNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

function listSnapshotFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  const dirs = fs.readdirSync(DATA_DIR, { withFileTypes: true });
  const files = [];

  for (const entry of dirs) {
    if (!entry.isDirectory()) continue;
    const folder = path.join(DATA_DIR, entry.name);
    const candidates = [path.join(folder, "output.json"), path.join(folder, "ouput.json")];
    const existing = candidates.find(file => fs.existsSync(file));
    if (existing) files.push({ source: entry.name, file: existing });
  }

  return files;
}

function normalizeWeatherRecord(source, location, weather) {
  const lat = safeNumber(location.lat);
  const lng = safeNumber(location.lng);
  if (lat === null || lng === null) return null;

  const fromHour = safeNumber(weather.fromHour, Math.floor(Date.now() / 1000 / 3600) * 3600);
  const updatedTimestamp = safeNumber(weather.updatedTimestamp, fromHour);

  const geohash5 = geoHash.encode(lat, lng, 5);
  const geohash3 = geoHash.encode(lat, lng, 3);

  return {
    geohash5,
    geohash3,
    lat,
    lng,
    sourceApi: source,
    symbol: weather.symbol || null,
    fromHour,
    altitude: safeNumber(weather.altitude),
    fogPercent: safeNumber(weather.fogPercent),
    pressureHPA: safeNumber(weather.pressureHPA),
    cloudinessPercent: safeNumber(weather.cloudinessPercent),
    windDirectionDeg: safeNumber(weather.windDirectionDeg),
    dewpointTemperatureC: safeNumber(weather.dewpointTemperatureC),
    windGustMps: safeNumber(weather.windGustMps),
    humidityPercent: safeNumber(weather.humidityPercent),
    areaMaxWindSpeedMps: safeNumber(weather.areaMaxWindSpeedMps),
    windSpeedMps: safeNumber(weather.windSpeedMps),
    temperatureC: safeNumber(weather.temperatureC),
    lowCloudsPercent: safeNumber(weather.lowCloudsPercent),
    mediumCloudsPercent: safeNumber(weather.mediumCloudsPercent),
    highCloudsPercent: safeNumber(weather.highCloudsPercent),
    temperatureProbability: safeNumber(weather.temperatureProbability),
    windProbability: safeNumber(weather.windProbability),
    updatedTimestamp,
    locationName: location.name || null
  };
}

function loadSnapshotData() {
  const files = listSnapshotFiles();
  const records = [];

  for (const { source, file } of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!Array.isArray(raw)) continue;

      for (const item of raw) {
        const location = item.location || {};
        const weatherList = Array.isArray(item.weather)
          ? item.weather
          : item.weather
            ? [item.weather]
            : [];

        for (const weather of weatherList) {
          const rec = normalizeWeatherRecord(source, location, weather || {});
          if (rec) records.push(rec);
        }
      }
    } catch (error) {
      console.warn(`Skipping snapshot file ${file}: ${error.message}`);
    }
  }

  return records;
}

function aggregateStats(records) {
  const bySource = new Map();
  const byTotal = new Map();

  const addToBucket = (bucket, record) => {
    const key = record.fromHour;
    if (!bucket.has(key)) {
      bucket.set(key, {
        runTimeStamp: key,
        countOfItems: 0,
        sumOfTempC: 0,
        sumOfWindMps: 0,
        sumOfPressureHPA: 0,
        lastUpdateTimestamp: 0,
        sumOfTempCDiff: 0,
        tempDiffCount: 0
      });
    }

    const agg = bucket.get(key);
    agg.countOfItems += 1;
    agg.sumOfTempC += record.temperatureC || 0;
    agg.sumOfWindMps += record.windSpeedMps || 0;
    agg.sumOfPressureHPA += record.pressureHPA || 0;
    agg.lastUpdateTimestamp = Math.max(agg.lastUpdateTimestamp, record.updatedTimestamp || 0);
  };

  for (const record of records) {
    if (!bySource.has(record.sourceApi)) bySource.set(record.sourceApi, new Map());
    addToBucket(bySource.get(record.sourceApi), record);
    addToBucket(byTotal, record);
  }

  const finalize = map =>
    Array.from(map.values())
      .sort((a, b) => b.runTimeStamp - a.runTimeStamp)
      .map(row => ({
        ...row,
        sumOfTempC: Number(row.sumOfTempC.toFixed(3)),
        sumOfWindMps: Number(row.sumOfWindMps.toFixed(3)),
        sumOfPressureHPA: Number(row.sumOfPressureHPA.toFixed(3))
      }));

  const statsBySource = {};
  for (const [source, map] of bySource.entries()) {
    statsBySource[source] = finalize(map);
  }

  return {
    statsBySource,
    total: finalize(byTotal)
  };
}

const snapshotRecords = loadSnapshotData();
const sourceApis = Array.from(new Set(snapshotRecords.map(r => r.sourceApi))).sort();
const { statsBySource, total } = aggregateStats(snapshotRecords);

function findBestMatch(lat, lng, timestamp) {
  const targetGeo3 = geoHash.encode(lat, lng, 3);
  const targetHour = Math.floor((timestamp || Date.now() / 1000) / 3600) * 3600;

  let candidates = snapshotRecords.filter(r => r.geohash3 === targetGeo3);
  if (candidates.length === 0) {
    candidates = snapshotRecords;
  }

  candidates = candidates
    .map(r => ({
      ...r,
      hourDelta: Math.abs((r.fromHour || targetHour) - targetHour),
      distance: distanceKm(lat, lng, r.lat, r.lng)
    }))
    .sort((a, b) => a.hourDelta - b.hourDelta || a.distance - b.distance);

  return candidates[0] || null;
}

function toApiResult(record) {
  return {
    weather: {
      geohash5: record.geohash5,
      geohash3: record.geohash3,
      sourceApi: record.sourceApi,
      symbol: record.symbol,
      fromHour: record.fromHour,
      altitude: record.altitude,
      fogPercent: record.fogPercent,
      pressureHPA: record.pressureHPA,
      cloudinessPercent: record.cloudinessPercent,
      windDirectionDeg: record.windDirectionDeg,
      dewpointTemperatureC: record.dewpointTemperatureC,
      windGustMps: record.windGustMps,
      humidityPercent: record.humidityPercent,
      areaMaxWindSpeedMps: record.areaMaxWindSpeedMps,
      windSpeedMps: record.windSpeedMps,
      temperatureC: record.temperatureC,
      lowCloudsPercent: record.lowCloudsPercent,
      mediumCloudsPercent: record.mediumCloudsPercent,
      highCloudsPercent: record.highCloudsPercent,
      temperatureProbability: record.temperatureProbability,
      windProbability: record.windProbability,
      updatedTimestamp: record.updatedTimestamp
    },
    location: {
      lat: record.lat,
      lng: record.lng,
      fromHour: record.fromHour,
      distance: Number(record.distance.toFixed(3))
    }
  };
}

module.exports = {
  snapshotRecords,
  sourceApis,
  statsBySource,
  total,
  findBestMatch,
  toApiResult
};
