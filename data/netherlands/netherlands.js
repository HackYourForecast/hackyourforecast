'use strict'

const cheerio = require('cheerio');
const axios = require('axios');
const moment = require('moment');
const path = require('path');
const { readJSONFile } = require(path.join(__dirname,'..','..','config','fileOperations'));

const DUTCH_URL = 'https://www.knmi.nl/nederland-nu/weer/waarnemingen';
const CITIES_LOCATION_FILE = path.join(__dirname,'netherlandsCities.json');

async function main() {
    try {

        const dutchCities = await readJSONFile(CITIES_LOCATION_FILE);
        const response = await axios.get(DUTCH_URL)
        const cheerioObject = cheerio.load(response.data);

        const updated = cheerioObject("div[class^= 'table__wrp'] div")
            .toArray().map(elem => elem.children[0].data);
        const updatedTimestamp = parseInt((+new Date()/1000) / 3600) * 3600
        const stationsData = cheerioObject('tbody > tr')
            .toArray()
            .map(row => row.children
                // Select only the cells
                .filter(cell => cell.name === 'td' && cell.type === 'tag')
                // Get only the content of each cell
                .map(td => td.children[0] && td.children[0].data)
            );

        const dutchWeather = stationsData.map(station => {
            const cityLocation = dutchCities.find(elem => elem.name === station[0]);
            return {
                location:
                {
                    lat: cityLocation.lat,
                    lng: cityLocation.lng
                }
            };
        });

        dutchWeather.forEach((city, index) => {
            city.weather = [{
                updatedTimestamp,
                fromHour: updatedTimestamp,
                toHour: updatedTimestamp + 3600,
                symbol: stationsData[index][1],
                temperatureC: stationsData[index][2],
                humidityPercent: stationsData[index][3],
                windSpeedMps: stationsData[index][6],
                visibilityM: stationsData[index][7],
                pressureHPA: stationsData[index][8]
            }];
        });

        console.log(JSON.stringify(dutchWeather, null, 2));
        return;

    } catch (error) {
        console.error(error, 'netherlands');
    }
}

main();
