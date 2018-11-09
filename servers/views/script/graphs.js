"use strict";

import { createHTMLElement, setAttributes } from "./domFunctions.js";

const apiStatsUrl = "/api/stats/list";
const statsBaseUrl = "/api/stats/";

const select = document.getElementById("select");
const apiTempAndWind = document
  .getElementById("apiTempAndWind")
  .getContext("2d");
const apiPressure = document.getElementById("apiPressure").getContext("2d");
const itemCounts = document.getElementById("itemCounts").getContext("2d");
const tempDiff = document.getElementById("tempDiff").getContext("2d");
const totalOption = createHTMLElement("option", select, "Total");

const getStats = async (url, callback) => {
  try {
    let res = await fetch(url);
    let json = await res.json();
    callback(json);
  } catch (err) {
    console.log(err);
  }
};
getStats(apiStatsUrl, handleSelect);
getStats(`${statsBaseUrl}total`, showStatistics);

function handleSelect(data) {
  for (let prop of data.sources) {
    const options = createHTMLElement("option", select, prop);
    setAttributes(options, { value: prop });
  }
  select.addEventListener("change", () => {
    getStats(`${statsBaseUrl}${select.value}`, showStatistics);
  });
}

function showStatistics(data) {
  let time = [];
  let apiSumOfTemp = [];
  let apiSumOfWind = [];
  let apiSumOfPressure = [];
  let countOfCities = [];
  let sumOfTempCDiff = [];

  data.sort((a, b) =>
    a.runTimeStamp.toString().localeCompare(b.runTimeStamp.toString())
  );

  for (let stats of data) {
    time.push(new Date(stats.runTimeStamp * 1000).toLocaleDateString());
    apiSumOfTemp.push(parseFloat(stats.sumOfTempC));
    apiSumOfWind.push(parseFloat(stats.sumOfWindMps));
    apiSumOfPressure.push(parseFloat(stats.sumOfPressureHPA));
    countOfCities.push(stats.countOfItems);
    sumOfTempCDiff.push(stats.sumOfTempCDiff);
  }

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
}

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
    options: {
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true
            }
          }
        ]
      }
    }
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
