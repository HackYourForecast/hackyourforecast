const axios = require("axios");
const geoHash = require("latlon-geohash");

function toHourTimestamp(unixSeconds = Date.now() / 1000) {
  return Math.floor(unixSeconds / 3600) * 3600;
}

module.exports = {
  id: "metno",
  displayName: "MET Norway",
  requiredEnv: ["METNO_USER_AGENT"],

  async fetchForecastForCity(city, context) {
    const userAgent = context.env.METNO_USER_AGENT;
    if (!userAgent) throw new Error("METNO_USER_AGENT missing");

    const lat = Number(city.lat);
    const lng = Number(city.lng);

    const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}`;

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": userAgent,
        Accept: "application/json"
      }
    });

    const timeseries = response.data?.properties?.timeseries || [];
    if (!timeseries.length) return null;

    const nowHour = context.nowHour;
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

    return {
      sourceApi: "metno",
      geohash5: geoHash.encode(lat, lng, 5),
      geohash3: geoHash.encode(lat, lng, 3),
      lat,
      lng,
      symbol,
      fromHour: hourTs,
      updatedTimestamp: context.nowHour,
      temperatureC: Number(details.air_temperature ?? null),
      pressureHPA: Number(details.air_pressure_at_sea_level ?? null),
      windSpeedMps: Number(details.wind_speed ?? null),
      humidityPercent: Number(details.relative_humidity ?? null)
    };
  }
};
