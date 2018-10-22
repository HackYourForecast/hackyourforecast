'use strict';
const weatherSymbols = {
  sun: 0,
  clear: 0,
  onbewolkt: 0,
  rain: 1,
  precipitation: 1,
  drizzel: 2,
  cloud: 3,
  overcast: 3,
  bewolkt: 3,
  fog: 4,
  haze: 4,
  mist: 4,
  sleet: 5,
  hail: 5,
  snow: 6
}

function translateSymbol(symbol){
    if (symbol) {
        for ( let i = 0; i < Object.keys(weatherSymbols); i++) {
            if (RegExp(Object.keys(weatherSymbols)[i], 'i').test(symbol)) {
                return weatherSymbols[Object.keys[i]];
            }
        }
    }
    return null;
}

module.exports = {translateSymbol};