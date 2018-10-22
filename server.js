const Express = require("express");
const app = Express();
const mysql = require('mysql');
const morgan = require('morgan');
const geoHash = require('latlon-geohash');
const sortByDistance = require("sort-by-distance");
const bodyParser = require('body-parser')


app.use(Express.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(morgan('short'));

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "amir",
  database: "weather",
  multipleStatements: true,
  debug: false
});

connection.connect(function (err) {
  if (err) {
    console.log(err);
  }
  console.log("Connected");
});


app.post('/api/weather', (req, res) => {
  const coords = req.body.locations;
  const queryPattern =
    "SELECT * FROM weather where geohash3 = ? && fromHour = ?;";
  let queryGeo3 = "";
  const queryCoords = [];
  for (let i = 0; i < coords.length; i++) {
    queryGeo3 += queryPattern;
    const geoHash3 = geoHash.encode((coords[i].lat), (coords[i].lng), 3)
    const time = coords[i].timestamp;
    queryCoords.push(geoHash3, time)
  }

  //query from database
  connection.query(queryGeo3, queryCoords, (err, rows) => {
    if (err) {
      console.log("Failed fetching the file " + err);
    }
    if (rows.length === 0) {
      res.send("We dont have any information with the data you entered.");
      res.end()
      return
    } else if (rows.length === 1) {
      res.json(rows)
      res.end()
      return
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
          const arr = sortByDistance(origin, point, opts)[0];
          sortItems.push(arr);
        }
      }
      res.json({ 'result': sortItems })
    }
  })
});



// weather api for all weather infos
app.get('/api/weather/', (req, res) => {
  const queryString = `SELECT * FROM weather`;
  connection.query(queryString, (err, rows, flieds) => {
    if (err) {
      console.log("Failed fetching the file" + err);
      res.status(500);
      res.end();
      return;
    }
    console.log("Fetched successfully");
    res.json(rows);
  })
});

app.get('/api/weather/license', (req, res) => {
  const licenses = {
    australia: "Based on data from Australia weather agency, License:http://www.bom.gov.au",
    belgium: "Based on data from Belgium weather agency, License: http://www.meteo.be",
    europe: "Based on data from Belgium weather agency, License: http://www.meteo.be",
    world: "Based on data from Belgium weather agency, License: http://www.meteo.be",
    poland: "Based on data from Poland weather agency, License: http://www.meteoprog.pl",
    sweden: "Based on data from Sweden weather agency, License: https://www.smhi.se",
    slovenia: "Based on data from Slovenia weather agency, License: https://meteo.si",
    southKorea: "Based on data from South Korea weather agency, License: https://web.kma.go.kr",
    unitedKingdom: "Based on data from United Kingdom weather agency, License:https://www.metoffice.gov.uk",
    iceland: "Based on data from Iceland weather agency, License: https://icelandmonitor.mbl.is",
    netherlands: "Based on data from The Netherlands weather agency, License: https://www.knmi.nl",
    usa: "Based on data from United States of America weather agency, License: https://icelandmonitor.mbl.is"
  };
  res.send(licenses);
});

app.listen(5002, () => console.log('Listening on port 5002'));



