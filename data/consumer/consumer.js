'use strict';

const geohash = require('latlon-geohash');
const mysql = require('mysql');
const fs = require('fs-extra');
const path = require('path');
const { translateSymbol } = require(path.join(__dirname,'translateSymbol'));

const {
    DB_CONFIG,
    QUERY_CHUNK_SIZE,
    TODO_DIR_PATH,
    ARCHIVE_DIR_PATH
} = require(path.join(__dirname,'..','..','config','config'));

const weatherFiles = fs.readdirSync(TODO_DIR_PATH);

if (Object.keys(weatherFiles).length === 0) {
    return console.log('All files are already inserted');
}

const dbConnection = mysql.createConnection({
    ...DB_CONFIG
});

dbConnection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    weatherFiles.forEach(file => {
        const filePATH = `${TODO_DIR_PATH}/${file}`;
        const stats = fs.statSync(filePATH);
        if (stats["size"] === 0) {
            console.log("File size :" + stats["size"]);
            fs.unlinkSync(filePATH);
            console.log(`${filePATH} was deleted!`)
            return;
        } else {
            let data = undefined;
            try {
                data = JSON.parse(fs.readFileSync(filePATH, 'utf8'));
            } catch(e) {
                console.error("failed to parse " + filePATH + " error: " + e);
		return;
            }
            if (data.length !== 0) {
                const sourceApi = file.split('.')[0].toLowerCase();;

                const sql =
                    'REPLACE INTO weather (geohash5, geohash3, lat, sourceApi, lng, symbol, fromHour, altitude,\
                    fogPercent, pressureHPA, cloudinessPercent, windDirectionDeg, dewpointTemperatureC, windGustMps,\
                    humidityPercent, areaMaxWindSpeedMps, windSpeedMps, temperatureC, lowCloudsPercent,\
                    mediumCloudsPercent, highCloudsPercent, temperatureProbability, windProbability,\
                    updatedTimestamp) VALUES ?';

                const values = [];

                data.forEach(locationElement => {
                    //checking if the fetch output is in valid format
                    if (locationElement.location === undefined || locationElement.weather === undefined) {
                        console.error(`input of ${filePATH} is not valid!`);
                        return
                    } else {
                        const geohash3 = geohash.encode(locationElement.location.lat, locationElement.location.lng, 3);
                        const geohash5 = geohash.encode(locationElement.location.lat, locationElement.location.lng, 5);
                        const lat = +locationElement.location.lat.toFixed(2);
                        const lng = +locationElement.location.lng.toFixed(2);
                        locationElement.weather.forEach(elem => {
                            const symbol = translateSymbol(elem.symbol);
                            for (let i = 0; i < (elem.toHour - elem.fromHour) / 3600; i++) {
                                let fromHour = parseInt(elem.fromHour) + (i * 3600);
                                fromHour = parseInt(fromHour/3600) * 3600;
                                values.push([geohash5, geohash3, lat, sourceApi, lng, symbol, fromHour,
                                    elem.altitude, elem.fogPercent, elem.pressureHPA, elem.cloudinessPercent, elem.windDirectionDeg,
                                    elem.dewpointTemperatureC, elem.windGustMps, elem.humidityPercent, elem.areaMaxWindSpeedMps,
                                    elem.windSpeedMps, elem.temperatureC, elem.lowCloudPercent, elem.mediumCloudPercent,
                                    elem.highCloudPercent, elem.temperatureProbability, elem.windProbability, elem.updatedTimestamp]);
                            }
                        });
                    }
                });
                for (let i = 0; i < values.length; i += QUERY_CHUNK_SIZE) {
                    const arr = values.slice(i, i + QUERY_CHUNK_SIZE);
                    // console.log(`inserting data${i} to data ${i + QUERY_CHUNK_SIZE}`)
                    dbConnection.query(sql, [arr],
                        (err, result) => {
                            if (err) console.error(`Error: couldn't insert data from ${sourceApi} - ${err}`);
                            else console.log(result.affectedRows + ' rows inserted');
                        }
                    );
                }

                fs.move(`${TODO_DIR_PATH}/${file}`, `${ARCHIVE_DIR_PATH}/${file}`, (err) => {
                    if (err) {
                        console.error(`Error: couldn't archive file ${file} - ${err}`);
                    };;
                    console.log(`File ${file} is archived!`);
                });

            } else {
                fs.unlinkSync(filePATH);
                console.log(`${file} doesn't have data and is deleted!`)
            }

        }
    });

    dbConnection.end();
}); 
