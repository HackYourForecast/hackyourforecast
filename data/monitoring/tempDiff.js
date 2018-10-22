'use strict';

const mysql = require('mysql');
const geolib = require('geolib');
const { promisify } = require('util');

const { DB_CONFIG, SOURCE_APIS } = require('../../config/config');

const citiesDiff = [];

async function tempDiff(hourTimestamp) {

  let dbConnection;
  try {

    dbConnection = mysql.createConnection({ ...DB_CONFIG });
    dbConnection.query = promisify(dbConnection.query);

    const sqlMonitoringTable =
      'SELECT geohash5, geohash3, lat, lng, temperatureC FROM weather_monitoring WHERE fromHour = ? ';

    const sqlWeatherTable =
      'SELECT sourceApi, geohash5, geohash3, lat, lng, temperatureC FROM weather WHERE fromHour = ? AND geohash3 = ?';

    const monitoringResults = await dbConnection.query(sqlMonitoringTable, hourTimestamp);

    for (let i = 0; i < monitoringResults.length; i++) {

      const monitoredCity = monitoringResults[i]
      const sameGeohash3Cities = await dbConnection.query(sqlWeatherTable, [hourTimestamp, monitoredCity.geohash3]);

      if (sameGeohash3Cities.length > 0) {

        const locationsArray = sameGeohash3Cities.map(city =>
          ({ latitude: city.lat, longitude: city.lng })
        );

        const orderedLocations = geolib.orderByDistance(
          { latitude: monitoredCity.lat, longitude: monitoredCity.lng }, locationsArray);

        const closestIndex = orderedLocations[0].key;

        citiesDiff.push({
          sourceApi: sameGeohash3Cities[closestIndex].sourceApi,
          tempDiff: monitoredCity.temperatureC - sameGeohash3Cities[closestIndex].temperatureC
        });
      }

    }

    let diffArray = SOURCE_APIS.map(source => {
      let citiesCount = 0;
      const sumOfTempDiff = citiesDiff.reduce((acc, elem) => {
        if (elem.sourceApi === source) {
          citiesCount++
          return acc + elem.tempDiff
        }
        return acc
      }, 0);
      return {
        sourceApi: source,
        sumOfTempDiff,
        citiesCount
      };
    });
    insertTempDiff(dbConnection, hourTimestamp, diffArray);

  }
  catch (error) {
    console.log(error)
  } finally {
    dbConnection.end();
  }

}

function insertTempDiff(connection, hourTimestamp, diffArray) {

  const insertSql = 'UPDATE stats SET sumOfTempCDiff = ?, tempDiffCount = ? WHERE sourceApi = ? AND runTimestamp = ?';

  diffArray.map(elem =>

    connection.query(insertSql, [+elem.sumOfTempDiff.toFixed(2), elem.citiesCount, elem.sourceApi, hourTimestamp],
      (err, result) => {
        if (err) throw err;
        console.log(result.affectedRows + ' tempDiff updated for ' + elem.sourceApi);
      })

  );

}

module.exports = tempDiff;