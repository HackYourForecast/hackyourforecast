const slovenia = 'http://meteo.arso.gov.si/uploads/probase/www/observ/surface/text/en/observation_si_latest.xml';
const http = require('http');
const parseString = require('xml2js').parseString;
const wind = require('windrose');

async function main() {
    try {
        let xml = '';
        //http://antrikshy.com/blog/fetch-xml-url-convert-to-json-nodejs
        function xmlToJson(url, callback) {
            let req = http.get(url, function (res) {
                let xml = '';

                res.on('data', function (chunk) {
                    xml += chunk;
                });

                res.on('error', function (e) {
                    callback(e, null);
                });

                res.on('timeout', function (e) {
                    callback(e, null);
                });

                res.on('end', function () {
                    parseString(xml, function (err, result) {
                        callback(null, result);
                    });
                });
            });
        }

        await xmlToJson(slovenia, function (err, data) {
            if (err) {
                return console.err(err);
            }

            let xmlData = data.data.metData
            const cities = xmlData.map(arr => {
                return {
                    StationName: (arr.domain_longTitle).toString(),
                    lat: parseFloat((arr.domain_lat).toString()),
                    lng: parseFloat((arr.domain_lon).toString()),
                    altitude: parseFloat((arr.domain_altitude).toString())
                };
            });

            const objects = xmlData.map(arr => {
                let degree = wind.getDegrees((arr.dd_shortText).toString());
                if (degree !== undefined) {
                    return {
                        updatedTimestamp: Date.parse((arr.tsUpdated_RFC822).toString()) / 1000,
                        fromHour: Date.parse((arr.tsValid_issued_RFC822).toString()) / 1000,
                        toHour: (Date.parse((arr.tsValid_issued_RFC822).toString()) / 1000) + 7200,
                        temperatureC: parseFloat((arr.t).toString()),
                        pressureHPA: parseFloat((arr.p).toString()),
                        windSpeedMps: parseFloat((arr.ff_val).toString()),
                        windDirectionDeg: degree.value,
                        symbol: (arr.nn_shortText).toString(),
                        humidityPercent: parseFloat((arr.rh).toString())
                    };
                }
                else {
                    return {
                        updatedTimestamp: Date.parse((arr.tsUpdated_RFC822).toString()) / 1000,
                        fromHour: Date.parse((arr.tsValid_issued_RFC822).toString()) / 1000,
                        toHour: (Date.parse((arr.tsValid_issued_RFC822).toString()) / 1000) + 7200,
                        temperatureC: parseFloat((arr.t).toString()),
                        pressureHPA: parseFloat((arr.p).toString()),
                        windSpeedMps: parseFloat((arr.ff_val).toString()),
                        symbol: (arr.nn_shortText).toString(),
                        humidityPercent: parseFloat((arr.rh).toString())
                    };
                }
            });

            const array = [];
            for (i = 0; i < xmlData.length; i++) {
                const obj = {
                    location: cities[i],
                    weather: [objects[i]]
                }
                array.push(obj)
            }
            console.log(JSON.stringify(array, null, 2));
        });

    } catch (error) {
        console.log(error)
    }
}
main()