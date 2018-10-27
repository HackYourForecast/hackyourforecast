const config = {};

config.TODO_DIR_PATH = "../tmp/todo"; // define the path where output will be saved
config.ARCHIVE_DIR_PATH = "../tmp/archive"; //define the path where output will be archived
config.SOURCE_APIS = [
  "rmi_Belgium",
  "Netherlands",
  "Iceland",
  "USA",
  "metOfficeUK",
  "Australia",
  "rmi_Europe",
  "Poland",
  "Slovenia",
  "SouthKorea",
  "SMHI",
  "rmi_World"
];
config.DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "password",
  database: "weather"
};
config.STATS_API_PORT = 5000;
config.QUERY_CHUNK_SIZE = 500;
config.SLEEP_IN_SECOND = 1;
config.USA_API_USERAGENT =
  "freeWeatherapi/v1.0 (http://freeweatherapi.com; nevine.atike@gmail.com)";

config.metOfficeUK_key = "9faed075-1026-4785-83d4-3a6ccd5e4306";
config.metOfficeUK_chunk = 9;

config.smhi_db = {
  host: "localhost",
  user: "root",
  password: "Data000",
  database: "weather"
};

config.SMTP_CONFIG = {
  user: "user@example.com",
  pass: "password"
}

config.smhi_downsample = 17;

module.exports = config;
