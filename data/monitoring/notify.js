'use strict';

const mysql = require('mysql');
const { promisify } = require('util');

const { DB_CONFIG, SOURCE_APIS } = require('../../config/config');
const sendEmail = require('./sendEmail');
const NOTIFY_AFTER = 4;

async function main() {

  let dbConnection;
  const notifyTimestamp = Math.floor(Date.now() / 1000) - 3600 * NOTIFY_AFTER;
  const yesterday = Math.floor(Date.now() / 1000) - 3600 * 24;

  try {

    dbConnection = mysql.createConnection({ ...DB_CONFIG });
    dbConnection.query = promisify(dbConnection.query);

    const sourceResults = await dbConnection.query(
      'SELECT name, contributorEmail from source where isActive = 1');

    const sql = 'SELECT SUM(countOfItems) AS count, SUM(sumOfTempC) AS sumOfTempC, SUM(sumOfWindMps) \
     AS sumOfWindMps,MAX(lastUpdateTimestamp) AS lastUpdate \
      FROM stats WHERE sourceApi = ? AND runTimeStamp > ? ';

    for (let i = 0; i < sourceResults.length; i++) {
      let warn = false;
      let warnMsg;
      const results = await dbConnection.query(sql, [sourceResults[i].name, notifyTimestamp]);
      if (results.length > 0) {
        if (results[0].count === 0) {
          warn = true;
          warnMsg = 'The API has not provided data for any city';
        } else if (results[0].sumOfTempC === null || results[0].sumOfWindMps === null) {
          warn = true;
          warnMsg = 'Error getting one or more weather data';
        }
        else if (results[0].lastUpdate < yesterday) {
          warn = true;
          warnMsg = 'The API has not been updated for last 24 hours';
        }
      } else {
        warn = true;
        warnMsg = `The API has not provided any data for last ${NOTIFY_AFTER} hours`;
      }
      if (warn) {
        sendEmail(sourceResults[i].contributorEmail, `${sourceResults[i].name} Error`, warnMsg);
      }
    }

  }
  catch (error) {
    console.log(error)
  } finally {
    dbConnection.end();
  }

}

main();