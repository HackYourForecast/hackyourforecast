const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const request = require("request");
const requireDir = require("require-dir");
const cities = requireDir("../citiesFolder");

const axios = require("axios");
const { STATS_API_PORT, STATS_API_HOST } = require("../config/config");

app.set("view engine", "ejs");
app.set("views", "../views");
app.use("/public", express.static("../public"));
app.use("/script", express.static("../views/script"));
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

app.get("/weather", (req, res) => {
  res.render("weather");
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

// axios
//   .post("localhost:5000/api/weather", {
//     locations: [{ lat: "-38.36", lng: "-22.73", timestamp: "1539969000" }]
//   })
//   .then(res => console.log(res))
//   .catch(err => console.log(err));

app.post("/weather", (req, res) => {
  // let lng = req.body.longitude;
  // let lat = req.body.latitude;
  // let timestamp = req.body.timestamp;

  const city = req.body.city;
  let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
  request(url, function(err, response, body) {
    if (err) {
      res.render("weather", {
        weather: null,
        error: "Error, please try again"
      });
    } else {
      let weather = JSON.parse(body);
      if (weather.main === undefined) {
        res.render("weather", {
          weather: null,
          error: "Error, please try again"
        });
      } else {
        let weatherText = weather.main.temp;
        let city = weather.name;
        let description = weather.weather[0].description;
        res.render("weather", {
          weather: { weatherText, city, description },
          error: null
        });
      }
    }
  });
});

module.exports = app;
