"use strict";
const cheerio = require('cheerio');
const axios = require('axios');
const wind = require('windrose')
const coords = require('../data.json');
const belgium = 'http://www.meteo.be/meteo/view/en/123386-Observations.html';

async function main() {
    try {
        const res = await axios.get(belgium);
        const object = cheerio.load(res.data);

        const cities = object('table city')
            .toArray()
            .map(city => city.children[0].data)
            .map(city => {
                const getCities = coords.find(elem => elem.name === city);
                if (!getCities) return;
                return {
                    name: city,
                    lat: getCities.lat,
                    lng: getCities.lng
                };
            })

        const data = object('tbody > tr')
            .toArray()
            .map(row => row.children
                .filter(cell => cell.name === 'td' && cell.type === 'tag')
                .map(td => td.children[0] && td.children[0].data));

        data.splice(0, 2);
        data.forEach(elem => elem.shift());
        data.forEach(arr => {
            arr[4] = (arr[4] * 0.277777778).toFixed(2);
        });

        let time = object('.table')
            .children('h3')
            .text()
            .replace("Observations  ", "")
            .replace("(", "")
            .replace(" h)", ":00");
        let date = Date.parse(time) / 1000;

        const objects = data.map(arr => {
            if (arr[5] == "-") {
                arr[5] = null
            }
            let degree = wind.getDegrees(arr[3])
            if (degree !== undefined) {
                return {
                    updatedTimestamp: date,
                    fromHour: date,
                    toHour: date + 7200,
                    temperatureC: parseFloat(arr[0]),
                    humidityPercent: parseFloat(arr[1]),
                    pressureHPA: parseFloat(arr[2]),
                    windDirectionDeg: degree.value,
                    windSpeedMps: parseFloat(arr[4]),
                    symbol: arr[5]
                };
            }
            else {
                return {
                    updatedTimestamp: date,
                    fromHour: date,
                    toHour: date + 3600,
                    temperatureC: parseFloat(arr[0]),
                    humidityPercent: parseFloat(arr[1]),
                    pressureHPA: parseFloat(arr[2]),
                    windDirectionDeg: null,
                    windSpeedMps: parseFloat(arr[4]),
                }
            }
        });

        const array = [];
        for (let i = 0; i < data.length; i++) {
            const obj = {
                location: cities[i],
                weather: [objects[i]]
            }
            array.push(obj)
        };

        console.log(JSON.stringify(array, null, 2));
    } catch (error) {
        console.error(error)
    }
}
main()