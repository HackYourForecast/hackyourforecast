const express = require("express");
const app = express();
const weatherApi = require("./weatherApi");
const statsApi = require("./statsApi");
const pagesServer = require("./pagesServer");
const { STATS_API_PORT } = require("../config/config");

//Amir's server handles weather api
app.use("/", weatherApi);
//Meazer's server handles stats api
app.use("/", statsApi);
//Knar's server renders pages
app.use("/", pagesServer);

app.listen(STATS_API_PORT, () => {
  console.log(`Listening to port: ${STATS_API_PORT}`);
});
