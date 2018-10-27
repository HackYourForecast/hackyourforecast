const express = require("express");
const app = express();
const weatherApi = require("./weatherApi");
const statsApi = require("./statsApi");
const pagesServer = require("./pagesServer");

//Amir's server handles weather api
app.use("/", weatherApi);
//Meazer's server handles stats api
app.use("/", statsApi);
//Knar's server renders pages
app.use("/", pagesServer);
let port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening to port: ${port}`);
});
