const cheerio = require('cheerio');
const axios = require('axios');
const moment = require('moment');
const Promise = require('bluebird');
const australiaLocations = require("./data.json");
const wind = require('windrose')


const endPoints =
    [
        "http://www.bom.gov.au/vic/observations/melbourne.shtml?ref=dropdown",
        "http://www.bom.gov.au/nsw/observations/sydney.shtml?ref=dropdown",
        "http://www.bom.gov.au/qld/observations/brisbane.shtml?ref=dropdown",
        "http://www.bom.gov.au/wa/observations/perth.shtml?ref=dropdown",
        "http://www.bom.gov.au/sa/observations/adelaide.shtml?ref=dropdown",
        "http://www.bom.gov.au/tas/observations/hobart.shtml?ref=dropdown",
        "http://www.bom.gov.au/act/observations/canberra.shtml?ref=dropdown",
        "http://www.bom.gov.au/nt/observations/darwin.shtml?ref=dropdown"
    ]

function getCityData(areaUrl) {
    return new Promise(async (resolve, reject) => {
        try {
            const urlResponse = await axios.get(areaUrl);
            const object = cheerio.load(urlResponse.data);
            const cities = object('tr > th > a')
                .toArray()
                .map(elem => elem.children[0].data)
                .map(city => {
                    const cityCoords = australiaLocations.find(c =>
                        new RegExp(`${c.name}\\b.*`, "i").test(city)
                    );
                    if (!cityCoords) return;
                    return {
                        name: city,
                        lat: cityCoords.lat,
                        lng: cityCoords.lng,
                        altM: cityCoords.altM
                    };
                })

            let utcTime;
            let timeStamp;
            const header = object('h1')
                .toArray()
                .map(th => th.children[0] && th.children[0].data);
            const data = object('tbody > tr')
                .toArray()
                .map(row => row.children
                    .filter(cell => cell.name === 'td' && cell.type === 'tag')
                    .map(td => td.children[0] && td.children[0].data));
            const weatherInfo = data.map(arr => {
                if (new RegExp('melbourne', 'i').test(header) || new RegExp('sydney', 'i').test(header) || new RegExp('canberra', 'i').test(header) || new RegExp('hobart', 'i').test(header)) {
                    utcTime = moment(arr[0], "DD/hh:mma").unix() - 32400;
                    timeStamp = parseInt(utcTime / 3600) * 3600
                } else if (new RegExp("brisbane", "i").test(header)) {
                    utcTime = moment(arr[0], "DD/hh:mma").unix() - 28800;
                    timeStamp = parseInt(utcTime / 3600) * 3600
                } else if (new RegExp("adelaide", "i").test(header)) {
                    utcTime = moment(arr[0], "DD/hh:mma").unix() - 30600;
                    timeStamp = parseInt(utcTime / 3600) * 3600
                } else if (new RegExp("darwin", "i").test(header)) {
                    utcTime = moment(arr[0], "DD/hh:mma").unix() - 27000;
                    timeStamp = parseInt(utcTime / 3600) * 3600
                } else if (new RegExp("perth", "i").test(header)) {
                    utcTime = moment(arr[0], "DD/hh:mma").unix() - 21600;
                    timeStamp = parseInt(utcTime / 3600) * 3600

                }
                let degree = wind.getDegrees(arr[6])
                if (degree !== undefined) {
                    let i = degree.value
                    return {
                        "fromHour": timeStamp,
                        "toHour": timeStamp + 7200,
                        "updatedTimestamp": utcTime,
                        "temperatureC": Number(arr[1]),
                        "dewpointTemperatureC": Number(arr[3]),
                        "humidityPercent": Number(arr[4]),
                        "windDirectionDeg": i,
                        "windSpeedMps": Number((arr[7] * 0.277777778).toFixed(2)),
                        "windGustMps": Number((arr[8] * 0.277777778).toFixed(2)),
                        "pressureHPA": Number(arr[11])
                    }
                } else {
                    return {
                        "fromHour": timeStamp,
                        "toHour": timeStamp + 7200,
                        "updatedTimestamp": utcTime,
                        "temperatureC": Number(arr[1]),
                        "dewpointTemperatureC": Number(arr[3]),
                        "humidityPercent": Number(arr[4]),
                        "windSpeedMps": Number((arr[7] * 0.277777778).toFixed(2)),
                        "windGustMps": Number((arr[8] * 0.277777778).toFixed(2)),
                        "pressureHPA": Number(arr[11])
                    }
                }

            });

            const array = [];

            for (let i = 0; i < cities.length; i++) {
                if (!cities[i])
                    continue;
                const obj = {
                    location: cities[i],
                    weather: [weatherInfo[i]]
                }
                array.push(obj);
            }
            resolve(array);
        }
        catch (error) {
            console.log(error);
            reject(error);
        }
    });
}

Promise.mapSeries(endPoints, getCityData)
    .then((citiesWeather) => {
        const finalResult = [].concat.apply([], citiesWeather);
        console.log(JSON.stringify(finalResult, null, 2))
    })
