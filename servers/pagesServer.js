const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const request = require("request");
const requireDir = require("require-dir");
const cities = requireDir("../citiesFolder");
const path = require("path");
const axios = require("axios");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/script", express.static(path.join(__dirname, "views", "script")));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/api", (req, res) => {
  res.render("api");
});

app.get("/map", (req, res) => {
  res.render("map");
});

app.get("/npm", (req, res) => {
  res.render("npm");
});

app.get("/contribute", (req, res) => {
  res.render("contribute");
});

app.get("/apitester", (req, res) => {
  res.render("apitester");
});

app.get("/monitoring", (req, res) => {
  res.render("monitoring");
});

app.get("/about", (req, res) => {
  res.render("aboutus");
});

app.get("/cities", (req, res) => {
  res.send(cities);
});

app.post("/apitester", (req, res) => {
  let lng = req.body.longitude;
  let lat = req.body.latitude;
  let timestamp = req.body.timestamp;

  axios
    .post("https://www.hackyourforecast.com/api/weather", {
      locations: [{ lat: lat, lng: lng, timestamp: timestamp }]
    })
    .then(res => handleData(res))
    .catch(err =>
      console.error(
        `Can not fetch the endpoint ${err.response.status} - ${
          err.response.statusText
        }`
      )
    );

  const handleData = response => {
    if (response.data.result === undefined) {
      console.log(response.data);
      res.render("apitester", {
        data: {
          json: response.data,
          error: null
        }
      });
    } else {
      res.render("apitester", {
        data: {
          json: JSON.stringify(response.data.result, null, 4),
          error: null
        }
      });
    }
  };
});

module.exports = app;
