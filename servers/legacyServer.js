const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
const requireDir = require("require-dir");

const app = express();
const cities = requireDir("../citiesFolder");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "legacy-views"));
app.use("/legacy/public", express.static(path.join(__dirname, "public")));
app.use("/legacy/script", express.static(path.join(__dirname, "views", "script")));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/legacy", (req, res) => {
  res.render("index");
});

app.get("/legacy/api", (req, res) => {
  res.render("api");
});

app.get("/legacy/map", (req, res) => {
  res.render("map");
});

app.get("/legacy/npm", (req, res) => {
  res.render("npm");
});

app.get("/legacy/contribute", (req, res) => {
  res.render("contribute");
});

app.get("/legacy/apitester", (req, res) => {
  res.render("apitester");
});

app.get("/legacy/monitoring", (req, res) => {
  res.render("monitoring");
});

app.get("/legacy/about", (req, res) => {
  res.render("aboutus");
});

app.get("/legacy/cities", (req, res) => {
  res.send(cities);
});

app.post("/legacy/apitester", (req, res) => {
  const lng = req.body.longitude;
  const lat = req.body.latitude;
  const timestamp = req.body.timestamp;
  const apiBase = `${req.protocol}://${req.get("host")}`;

  axios
    .post(`${apiBase}/api/weather`, {
      locations: [{ lat, lng, timestamp }]
    })
    .then(response => {
      const json =
        response?.data?.result === undefined
          ? response.data
          : JSON.stringify(response.data.result, null, 4);
      res.render("apitester", {
        data: {
          json,
          error: null
        }
      });
    })
    .catch(error => {
      const message =
        error?.response?.status && error?.response?.statusText
          ? `Can not fetch the endpoint ${error.response.status} - ${error.response.statusText}`
          : `Can not fetch the endpoint: ${error.message}`;
      res.render("apitester", {
        data: {
          json: message,
          error: message
        }
      });
    });
});

module.exports = app;
