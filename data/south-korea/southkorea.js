const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const fs = require("fs");
const wind = require('windrose');

const citiesAndCoords = require("../data.json");

(async function fetchKoreanAPI() {
    const url = "http://web.kma.go.kr/eng/weather/forecast/current_korea.jsp";
    const response = await axios.get(url);
    const html = response.data;

    const $ = cheerio.load(html);

    const rows = $(".table_midterm > tbody > tr").toArray();
    let result = [];
    let stats = {};
    rows.forEach(row => {
        try {
            let time = $(".tab_cap").text()
                .replace("KST ", "")

            const getDataAt = n => row.children[n].children[0].data;

            const cityName = getDataAt(1);
            const symbol = getDataAt(3);
            const cloudsPercent = Number(getDataAt(7) * 10);
            const temperatureC = Number(getDataAt(9));
            const windDirectionDeg = wind.getDegrees(getDataAt(11))
            const windSpeedMps = Number(getDataAt(13));
            const humidityPercent = Number(getDataAt(15));
            const pressureHPA = Number(getDataAt(19));
            const cityDetails = citiesAndCoords.find(city => city.name === cityName);
            const updatedTimestamp = (moment(time, "ddd MMM DD HH:mm:ss YYYY").unix()) - 25200;
            if (windDirectionDeg !== undefined) {
                let i = windDirectionDeg.value;
                result.push({
                    location: cityDetails,
                    weather: [{
                        updatedTimestamp,
                        fromHour: updatedTimestamp,
                        toHour: updatedTimestamp + 3600,
                        temperatureC,
                        cloudsPercent,
                        humidityPercent,
                        windSpeedMps,
                        windDirectionDeg: i,
                        pressureHPA,
                        symbol
                    }]
                })
            } else {
                result.push({
                    location: cityDetails,
                    weather: [{
                        updatedTimestamp,
                        fromHour: updatedTimestamp,
                        toHour: updatedTimestamp + 7200,
                        temperatureC,
                        cloudsPercent,
                        humidityPercent,
                        windSpeedMps,
                        pressureHPA,
                        symbol
                    }]
                })
            }

            const { lat, lng } = cityDetails;

        } catch (e) {
            console.error(`\n✗ ${e.message}\n`);
        }
    });

    if (!result) return;

    const datePrefix = process.argv[2];

    if (process.argv.length === 2) {
        console.log(JSON.stringify(result, null, 2));
    }
})();