const Express = require("express");
const {
  sourceApis: SOURCE_APIS,
  statsBySource,
  total
} = require("./snapshotStore");

const app = Express();

app.get("/api/stats/list", (req, res, next) => {
  if (SOURCE_APIS) res.json({ sources: SOURCE_APIS });
  else next(new Error("Error getting sources list..."));
});

app.get("/api/stats/total", (req, res, next) => {
  if (total.length === 0) return next(new Error("No data available for this request..."));
  return res.json(total);
});

app.get("/api/stats/:sourceApi", (req, res, next) => {
  const sourceApi = req.params.sourceApi.toLowerCase();
  if (sourceApi === "total") {
    if (total.length === 0) return next(new Error("No data available for this request..."));
    return res.json(total);
  }

  if (SOURCE_APIS.find(elem => elem.toLowerCase() === sourceApi)) {
    const results = statsBySource[sourceApi] || [];
    if (results.length === 0) return next(new Error("No data available for this request..."));
    return res.json(results);
  }

  return res.status(404).json({ error: `source API ${sourceApi} not found` });
});

app.get("/api/stats/", (req, res, next) => {
  if (SOURCE_APIS.length === 0) return next(new Error("No data available for this request..."));

  const groupedResult = {};
  SOURCE_APIS.forEach(source => {
    groupedResult[source] = statsBySource[source] || [];
  });
  return res.json(groupedResult);
});

app.use((error, req, res, next) => {
  res.status(500).json({ response: error.message });
});

module.exports = app;
