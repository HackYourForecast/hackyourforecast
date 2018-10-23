const config = {};

config.TODO_DIR_PATH = "./tmp/todo"; // define the path where output will be saved
config.ARCHIVE_DIR_PATH = "./tmp/archive"; //define the path where output will be archived
config.SOURCE_APIS = ['rmi_belgium', 'netherlands', 'iceland', 'usa', 'metOfficeUK', 'australia',
  'rmi_europe', 'poland', 'slovenia', 'southKorea', 'smhi'];
config.DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'root2018',
  database: 'smhi_db'
}
config.STATS_API_PORT = 3000;
config.QUERY_CHUNK_SIZE = 500;
config.SLEEP_IN_SECOND = 2;
config.USA_API_USERAGENT =
  "freeWeatherapi/v1.0 (http://freeweatherapi.com; nevine.atike@gmail.com)";

config.metOfficeUK_key = "9faed075-1026-4785-83d4-3a6ccd5e4306";
config.metOfficeUK_chunk = 9;

config.smhi_db = {
  host: 'localhost',
  user: 'root',
  password: 'root2018',
  database: 'smhi_db'
}

config.smhi_downsample = 17;

module.exports = config;