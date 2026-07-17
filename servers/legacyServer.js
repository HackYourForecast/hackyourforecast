const express = require("express");
const path = require("path");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use("/legacy/public", express.static(path.join(__dirname, "public")));
app.use("/legacy/script", express.static(path.join(__dirname, "views", "script")));

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

module.exports = app;
