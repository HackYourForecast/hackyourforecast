'use strict';

const mysql = require('mysql');
const { promisify } = require('util');
const path = require('path');
const { DB_CONFIG, SOURCE_APIS } = require(path.join(__dirname,'..','..','config','config'));
const tempDiff = require(path.join(__dirname,'tempDiff'));

async function main() {

  let dbConnection;
  const runTimestamp = Math.floor(Date.now() / 1000);
  const hourTimestamp = (parseInt(runTimestamp / 3600) * 3600);

  try {

    dbConnection = mysql.createConnection({ ...DB_CONFIG });
    dbConnection.query = promisify(dbConnection.query);

    const sql = 'SELECT COUNT(geohash5) AS count, SUM(temperatureC), SUM(windSpeedMps), SUM(pressureHPA),\
    MAX(updatedTimestamp) FROM weather WHERE sourceApi = ? AND fromHour = ? ';
    for (let i = 0; i < SOURCE_APIS.length; i++) {
      console.log(sql, [SOURCE_APIS[i], hourTimestamp]); 
      const result = await dbConnection.query(sql, [SOURCE_APIS[i], hourTimestamp]);
      if (result.length > 0)
        await insertStats(dbConnection, SOURCE_APIS[i].toLowerCase(), runTimestamp, result[0]);
    }

  }
  catch (error) {
    console.log(error)
  } finally {
    dbConnection.end();
    tempDiff(hourTimestamp, runTimestamp);
  }

}

function insertStats(connection, sourceApi, runTimestamp, sourceData) {

  const insertSql = 'REPLACE INTO stats (runTimeStamp, sourceApi, countOfItems ,sumOfTempC, sumOfWindMps,\
     sumOfPressureHPA, lastUpdateTimestamp) values (?,?,?,?,?,?,?)';

  const insertValues = (sourceData.count === 0) ?
    [runTimestamp, sourceApi, sourceData.count, 0, 0, 0, 0] :
    [runTimestamp, sourceApi, sourceData.count, sourceData['SUM(temperatureC)'], +sourceData['SUM(windSpeedMps)'],
      sourceData['SUM(pressureHPA)'], sourceData['MAX(updatedTimestamp)']];
  console.log(insertValues);
  connection.query(insertSql, insertValues,
    (err, result) => {
      if (err) console.log(err);
      else console.log(result.affectedRows + ' rows updated in stats for ' + sourceApi + ' API');
    });

}

main();
