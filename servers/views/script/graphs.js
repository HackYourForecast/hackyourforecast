"use strict";

import { createHTMLElement, setAttributes } from "./domFunctions.js";

const apiStatsUrl = "/api/stats";
//const totalStatsUrl = "/api/stats/total";

const select = document.getElementById("select");
const apiTempAndWind = document
  .getElementById("apiTempAndWind")
  .getContext("2d");
const apiPressure = document.getElementById("apiPressure").getContext("2d");
const itemCounts = document.getElementById("itemCounts").getContext("2d");
const tempDiff = document.getElementById("tempDiff").getContext("2d");

const getStats = async (url, callback) => {
  try {
    let res = await fetch(url);
    let json = await res.json();
    console.log(json);
    callback(json);
  } catch (err) {
    console.log(err);
  }
};
getStats(apiStatsUrl, handleSelect);

function handleSelect(data) {
  for (let prop in data) {
    const options = createHTMLElement("option", select, prop);
    setAttributes(options, { value: prop });
  }
  select.addEventListener("change", () => {
    showStatistics(data[select.value]);
  });
}

const showStatistics = data => {
  let time = [];
  let apiSumOfTemp = [];
  let apiSumOfWind = [];
  let apiSumOfPressure = [];
  let countOfCities = [];
  let sumOfTempCDiff = [];

  for (let stats of data) {
    time.push(new Date(stats.runTimeStamp * 1000).toLocaleDateString());
    apiSumOfTemp.push(parseFloat(stats.sumOfTempC));
    apiSumOfWind.push(parseFloat(stats.sumOfWindMps));
    apiSumOfPressure.push(parseFloat(stats.sumOfPressureHPA));
    countOfCities.push(stats.countOfItems);
    sumOfTempCDiff.push(stats.sumOfTempCDiff);
  }
  console.log(apiSumOfPressure);
  setTimeout(
    createChart(
      time,
      apiSumOfTemp,
      apiSumOfWind,
      apiSumOfPressure,
      countOfCities,
      sumOfTempCDiff
    ),
    3000
  );
};

const createChart = (
  time,
  apiSumOfTemp,
  apiSumOfWind,
  apiSumOfPressure,
  countOfCities,
  sumOfTempCDiff
) => {
  const LineTempAndWind = new Chart(apiTempAndWind, {
    type: "line",
    data: {
      labels: time,
      datasets: [
        {
          label: "Sum of Temperature ",
          borderColor: "red",
          data: apiSumOfTemp
        },
        {
          label: "Sum of Wind",

          backgroundColor: "blue",
          data: apiSumOfWind
        }
      ]
    },
    options: {
      maintainAspectRatio: true,
      responsive: true
    }
  });

  const tempDiffMetNo = new Chart(tempDiff, {
    type: "line",
    data: {
      labels: time,
      datasets: [
        {
          label: "Sum of temperature difference compared with Met.no",
          backgroundColor: "orange",
          data: sumOfTempCDiff
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: true }
  });

  const linePressure = new Chart(apiPressure, {
    type: "line",

    data: {
      labels: time,
      datasets: [
        {
          label: "Sum of Pressure",
          backgroundColor: "green",
          data: apiSumOfPressure
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: true
    }
  });

  const barCities = new Chart(itemCounts, {
    type: "bar",
    data: {
      labels: time,
      datasets: [
        {
          label: "Count of cities",
          backgroundColor: "purple",
          data: countOfCities
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: true }
  });
};

//let apiUrl = "/api/stats";
//let totalUrl = "/api/stats/total";
// const getStats = async (url, callback) => {
//   try {
//     let res = await fetch(url);
//     let json = await res.json();
//     callback(json);
//   } catch (err) {
//     console.log(err);
//   }
// };
// getStats(totalUrl, handleStats);
// getStats(url, handleSelect);

// const sumTempAndWind = document
//   .getElementById("sumTempAndWind")
//   .getContext("2d");
// const sumPressure = document.getElementById("sumPressure").getContext("2d");
// const numItems = document.getElementById("numItems").getContext("2d");
// const tempDiff = document.getElementById("tempDiff").getContext("2d");
// const apiTempAndWind = document
//   .getElementById("apiTempAndWind")
//   .getContext("2d");

// let runTimeStamp = [];
// let countOfItems = [];
// let sumOfTempC = [];
// let sumOfPressureHPA = [];
// let sumOfTempCDiff = [];
// let sumOfWindMps = [];

// const handleStats = data => {
//   for (const stats of data) {
//     runTimeStamp.push(stats.runTimeStamp);
//     countOfItems.push(stats.countOfItems);
//     sumOfTempC.push(parseFloat(stats.sumOfTempC));
//     sumOfPressureHPA.push(parseFloat(stats.sumOfPressureHPA));
//     sumOfTempCDiff.push(parseFloat(stats.sumOfTempCDiff));
//     sumOfWindMps.push(parseFloat(stats.sumOfWindMps));
//   }
//   setTimeout(
//     createTotalCharts(
//       runTimeStamp,
//       sumOfTempC,
//       sumOfWindMps,
//       sumOfPressureHPA,
//       countOfItems,
//       sumOfTempCDiff
//     ),
//     2000
//   );
// };

// const createTotalCharts = (...data) => {
//   const LineTempAndWind = new Chart(sumTempAndWind, {
//     type: "line",
//     data: {
//       labels: data[0],
//       datasets: [
//         {
//           label: "Temperature ",
//           borderColor: "red",
//           data: data[1]
//         },
//         {
//           label: "Wind",

//           backgroundColor: "blue",
//           data: data[2]
//         }
//       ]
//     },

//     options: {
//       responsive: true,
//       maintainAspectRatio: true//     }
//   });

//   const linePressure = new Chart(sumPressure, {
//     type: "line",

//     data: {
//       labels: data[0],
//       datasets: [
//         {
//           label: "Wind",
//           backgroundColor: "green",
//           data: data[3]
//         }
//       ]
//     },

//     options: {
//       responsive: true,
//       maintainAspectRatio: true//     }
//   });

//   const barItems = new Chart(numItems, {
//     type: "bar",

//     data: {
//       labels: data[0],
//       datasets: [
//         {
//           label: "Number of Items",
//           backgroundColor: "blue",

//           data: data[4]
//         }
//       ]
//     },

//     options: {}
//   });

//   const barTempDiff = new Chart(tempDiff, {
//     type: "bar",

//     data: {
//       labels: data[0],
//       datasets: [
//         {
//           label: "Temperature Difference compared with met no",
//           backgroundColor: "purple",

//           data: data[5]
//         }
//       ]
//     },

//     options: {
//       responsive: true,
//       maintainAspectRatio: true//     }
//   });
// };

// let select = document.getElementById("select");

// const handleSelect = data => {
//   for (let prop in data) {
//     const options = createHTMLElement("option", select, prop);
//     setAttributes(options, { value: prop });
//   }
//   select.addEventListener("change", () => {
//     showStatistics(data[select.value]);
//   });
// };

// const showStatistics = data => {
//   let time = [];
//   let apiSumOfTemp = [];
//   let apiSumOfWind = [];

//   for (let stats of data) {
//     if (isNaN(stats.sumOfTempC) && isNaN(stats.sumOfWindMps)) {
//       apiSumOfTemp.push(0);
//       apiSumOfWind.push(0);
//     }
//     time.push(new Date(stats.runTimeStamp * 1000).toLocaleDateString());
//     apiSumOfTemp.push(parseFloat(stats.sumOfTempC));
//     apiSumOfWind.push(parseFloat(stats.sumOfWindMps));
//   }

//   setTimeout(createChart(time, apiSumOfTemp, apiSumOfWind), 3000);
// };

// const createChart = (time, apiSumOfTemp, apiSumOfWind) => {
//   const LineTempAndWind = new Chart(apiSumOfWind, {
//     type: "line",
//     data: {
//       labels: time,
//       datasets: [
//         {
//           label: "Temperature ",
//           borderColor: "red",
//           data: apiSumOfTemp
//         },
//         {
//           label: "Wind",

//           backgroundColor: "blue",
//           data: apiSumOfWind
//         }
//       ]
//     },
//     options: {
//       aintainAspectRatio: true
//     }
//   });
// };
