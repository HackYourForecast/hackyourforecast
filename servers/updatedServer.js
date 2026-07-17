const express = require("express");
const path = require("path");

const app = express();
const updatedUiDir = path.join(__dirname, "updated-ui");

app.use("/updated", express.static(updatedUiDir));
app.get("/updated", (req, res) => {
  res.sendFile(path.join(updatedUiDir, "index.html"));
});

module.exports = app;
