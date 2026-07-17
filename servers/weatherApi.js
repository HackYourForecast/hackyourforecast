const Express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const { findBestMatch, toApiResult, snapshotRecords } = require("./snapshotStore");

const app = Express();
app.use(Express.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(morgan("short"));

app.post("/api/weather", (req, res) => {
  const coords = Array.isArray(req.body.locations) ? req.body.locations : [];
  if (coords.length === 0) {
    return res.status(400).json({ error: "locations must be a non-empty array" });
  }

  if (snapshotRecords.length === 0) {
    return res.status(503).json({ error: "No snapshot weather data available" });
  }

  const result = coords
    .map(coord => {
      const lat = Number(coord.lat);
      const lng = Number(coord.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return { error: "Invalid location coordinates", location: coord };
      }

      const ts = Number(coord.timestamp || coord.timestam || Date.now() / 1000);
      const match = findBestMatch(lat, lng, ts);
      if (!match) {
        return { error: "Data not found for this location", location: { lat, lng } };
      }
      return toApiResult(match);
    })
    .filter(Boolean);

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
