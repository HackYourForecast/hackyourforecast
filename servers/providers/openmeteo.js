const axios = require("axios");
const geoHash = require("latlon-geohash");

function toHourTimestamp(unixSeconds = Date.now() / 1000) {
  return Math.floor(unixSeconds / 3600) * 3600;
}

function weatherCodeToSymbol(code) {
  if (code === null || code === undefined || Number.isNaN(Number(code))) return null;
  return `wmo:${Number(code)}`;
}

module.exports = {
  id: "openmeteo",
  displayName: "Open-Meteo",
  requiredEnv: [],

  async fetchForecastForCity(city, context) {
    const lat = Number(city.lat);
    const lng = Number(city.lng);

    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${encodeURIComponent(lat)}` +
      `&longitude=${encodeURIComponent(lng)}` +
      "&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,weather_code" +
      "&timezone=UTC&forecast_days=2";

    const response = await axios.get(url, {
      timeout: 15000,
      headers: { Accept: "application/json" }
    });

    const hourly = response.data?.hourly;
    if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) return null;

    const nowHour = context.nowHour;
    let idx = hourly.time.findIndex(t => toHourTimestamp(new Date(t).getTime() / 1000) >= nowHour);
    if (idx < 0) idx = 0;

    const fromHour = toHourTimestamp(new Date(hourly.time[idx]).getTime() / 1000);

    return {
      sourceApi: "openmeteo",
      geohash5: geoHash.encode(lat, lng, 5),
      geohash3: geoHash.encode(lat, lng, 3),
      lat,
      lng,
      symbol: weatherCodeToSymbol(hourly.weather_code?.[idx]),
      fromHour,
      updatedTimestamp: context.nowHour,
      temperatureC: Number(hourly.temperature_2m?.[idx] ?? null),
      pressureHPA: Number(hourly.surface_pressure?.[idx] ?? null),
      windSpeedMps: Number(hourly.wind_speed_10m?.[idx] ?? null),
      humidityPercent: Number(hourly.relative_humidity_2m?.[idx] ?? null)
    };
  }
};
