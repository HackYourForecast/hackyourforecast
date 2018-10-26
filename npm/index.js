'use strict';
const axios = require('axios');

class HackYourForecast {
  async lookup(userEntries) {
    try {
      if (!Array.isArray(userEntries)) {
        userEntries = [userEntries];
      }

      userEntries = userEntries.filter(entry => {
        if (!entry.timestamp) {
          const nowUNIX = Math.floor(new Date() / 1000);
          entry.timestamp = nowUNIX;
        }
        const timeIsUNIX =
          new Date(entry.timestamp * 1000).getFullYear() < 9999;
        if (!timeIsUNIX) {
          entry.timestamp = Date(entry.timestamp / 1000);
        }
        const timeFixedToHour = Math.floor(entry.timestamp / 3600) * 3600;
        entry.timestamp = timeFixedToHour;
        if (
          !Number(entry.lat) ||
          !Number(entry.lng) ||
          (entry.timestamp.toString().length !== 10 && timeIsUNIX)
        ) {
          console.error(
            `Something seem to be wrong please validate: ${JSON.stringify(
              entry
            )}`
          );
          return;
        }
        return entry;
      });

      return await this.queryBackend(userEntries);
    } catch (e) {
      console.error(e.message);
    }
  }

  async queryBackend(requestArr) {
    const axiosInstance = axios.create({
      baseURL: 'http://localhost:5002',
      timeout: 1000
    });
    const fetchedData = [];

    try {
      await axiosInstance
        .post('/api/weather', { locations: requestArr })
        .then(res => fetchedData.push(res.data));
    } catch (e) {
      console.error(e.message);
    }
    return JSON.stringify(fetchedData, null, 2);
  }
}

module.exports = new HackYourForecast();
