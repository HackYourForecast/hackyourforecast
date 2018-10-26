const Express = require("express");
const mysql = require("mysql");
const morgan = require("morgan");
const geoHash = require("latlon-geohash");
const sortByDistance = require("sort-by-distance");
const bodyParser = require("body-parser");
const config = require("../config/config");

const app = Express();
app.use(Express.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(morgan("short"));

const connection = mysql.createConnection({
  host: config.DB_CONFIG.host,
  user: config.DB_CONFIG.user,
  password: config.DB_CONFIG.password,
  database: config.DB_CONFIG.database,
  multipleStatements: true,
  debug: false
});

connection.connect(function(err) {
  if (err) {
    console.log(err);
  }
  console.log("Connected");
});

app.post("/api/weather", (req, res) => {
  const coords = req.body.locations;
  const queryPattern =
    "SELECT * FROM weather where geohash3 = ? && fromHour = ?;";
  let queryGeo3 = "";
  const queryCoords = [];
  for (let i = 0; i < coords.length; i++) {
    queryGeo3 += queryPattern;
    const geoHash3 = geoHash.encode(coords[i].lat, coords[i].lng, 3);
    const time = parseInt(coords[i].timestamp / 3600) * 3600;
    queryCoords.push(geoHash3, time);
  }

  //query from database
  connection.query(queryGeo3, queryCoords, (err, rows) => {
    if (err) {
      console.log("Failed fetching the file " + err);
    }
    if (rows.length === 0) {
      res.send("We dont have any information with the data you entered.");
      res.end();
      return;
    } else {
      console.log("Fetched successfully");

      // Set the items for each query to sort
      let sortItems = [];
      for (let i = 0; i < coords.length; i++) {
        for (let j = i; j < i + 1; j++) {
          let point;
          if (coords.length === 1) {
            point = rows;
          } else {
            point = rows[i];
          }
          const opts = { yName: "lat", xName: "lng" };
          const origin = { lat: coords[j].lat, lng: coords[j].lng };
          const object = sortByDistance(origin, point, opts)[0];
          if (object === undefined) {
            sortItems.push({ 'Data not found for this location' : origin})
          }else if (object.distance === undefined) {
            object.distance = 0;
            const structured = splitObj(object);
            sortItems.push(structured);
          } else {
            const structured = splitObj(object);
            sortItems.push(structured);
          }
        }
      }
      res.json({ result: sortItems });
    }
    function splitObj(obj) {
      try {
        return {
          weather: {
            'geohash5': obj.geohash5,
            'geohash3': obj.geohash3,
            'sourceApi': obj.sourceApi,
            'symbol': obj.symbol,
            'fromHour': obj.fromHour,
            'altitude': obj.altitude,
            'fogPercent': obj.fogPercent,
            'pressureHPA': obj.pressureHPA,
            'cloudinessPercent': obj.cloudinessPercent,
            'windDirectionDeg': obj.windDirectionDeg,
            'dewpointTemperatureC': obj.dewpointTemperatureC,
            'windGustMps': obj.windGustMps,
            'humidityPercent': obj.humidityPercent,
            'areaMaxWindSpeedMps': obj.areaMaxWindSpeedMps,
            'windSpeedMps': obj.windSpeedMps,
            'temperatureC': obj.temperatureC,
            'lowCloudsPercent': obj.lowCloudsPercent,
            'mediumCloudsPercent': obj.mediumCloudsPercent,
            'highCloudsPercent': obj.highCloudsPercent,
            'temperatureProbability': obj.temperatureProbability,
            'windProbability': obj.windProbability,
            'updatedTimestamp': obj.updatedTimestamp
          },
          location: {
            'lat': obj.lat,
            'lng': obj.lng,
            'fromHour': obj.fromHour,
            'distance': obj.distance
          }
        };
      } catch (e) {
        console.error(e.message);
      }
    }
  });
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