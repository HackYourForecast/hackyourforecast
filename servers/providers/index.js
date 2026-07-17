const metno = require("./metno");
const openmeteo = require("./openmeteo");

const registry = {
  [metno.id]: metno,
  [openmeteo.id]: openmeteo
};

function getEnabledProviders(env = process.env) {
  const configured = (env.HYF_PROVIDERS || "metno,openmeteo")
    .split(",")
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

  const uniqueIds = Array.from(new Set(configured));
  const providers = uniqueIds.map(id => registry[id]).filter(Boolean);
  const missing = uniqueIds.filter(id => !registry[id]);

  return { providers, missing };
}

module.exports = {
  registry,
  getEnabledProviders
};
