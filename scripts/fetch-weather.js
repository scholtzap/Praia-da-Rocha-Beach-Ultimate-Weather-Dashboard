// scripts/fetch-weather.js
const fs = require("fs");
const fetch = require("node-fetch");

const API_KEY = process.env.OWM_API_KEY;
const LAT = -33.9509;
const LON = 18.3774;
//const URL = `https://api.openweathermap.org/data/3.0/onecall?lat=${LAT}&lon=${LON}&exclude=minutely,alerts&units=metric&appid=${API_KEY}`;
const URL = `https://api.openweathermap.org/data/2.5/onecall?lat=${LAT}&lon=${LON}&exclude=minutely,alerts&units=metric&appid=${API_KEY}`;

async function run() {
  const res = await fetch(URL);
  if (!res.ok) {
    console.error("Failed to fetch weather data:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  const { hourly, current, daily } = data;

  const enriched = hourly.map(h => {
    const matchedDay = daily.find(d => {
      const date = new Date(h.dt * 1000).toISOString().split("T")[0];
      return new Date(d.dt * 1000).toISOString().split("T")[0] === date;
    });

    return {
      ...h,
      rain_mm: h.rain?.["1h"] || 0,
      sunrise: matchedDay?.sunrise,
      sunset: matchedDay?.sunset
    };
  });

  const output = { hourly: enriched };
  fs.writeFileSync("data/weather.json", JSON.stringify(output, null, 2));
  console.log("✅ Weather data written to data/weather.json");
}

run();
