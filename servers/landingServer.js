const express = require("express");
const path = require("path");

const app = express();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "updated-ui", "landing.html"));
});

module.exports = app;
