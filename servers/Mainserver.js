const express = require("express");
const app = express();
const weatherApi = require("./weatherApi");
const statsApi = require("./statsApi");
const pagesServer = require("./pagesServer");
const landingServer = require("./landingServer");
const legacyServer = require("./legacyServer");
const updatedServer = require("./updatedServer");
const { startIngestionScheduler } = require("./liveIngestion");

app.get("/healthz", (req, res) => {
  res.json({ ok: true, service: "hackyourforecast" });
});

//Amir's server handles weather api
app.use("/", weatherApi);
//Meazer's server handles stats api
app.use("/", statsApi);
//Modernized frontend app
app.use("/", updatedServer);
//Legacy namespace preserved
app.use("/", legacyServer);
//Landing chooser page
app.use("/", landingServer);
//Knar's server renders pages
app.use("/", pagesServer);
let port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening to port: ${port}`);
  startIngestionScheduler();
});
