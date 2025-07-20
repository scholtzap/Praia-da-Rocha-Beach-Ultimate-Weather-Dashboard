// scripts/fetch-weather.js
const fs = require("fs");
const fetch = require("node-fetch");

const API_KEY = process.env.OWM_API_KEY;
const LAT = -33.9509;
const LON = 18.3774;
//const URL = `https://api.openweathermap.org/data/3.0/onecall?lat=${LAT}&lon=${LON}&exclude=minutely,alerts&units=metric&appid=${API_KEY}`;
const URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${API_KEY}`;

async function run() {
  const res = await fetch(URL);
  if (!res.ok) {
    console.error("Failed to fetch weather data:", res.status, await res.text());
    process.exit(1);
  }

    const data = await res.json();
    const hourly = data.list.map(h => ({
    dt: h.dt,
    temp: h.main.temp,
    wind_speed: h.wind.speed,
    clouds: h.clouds.all,
    pop: h.pop || 0,
    rain_mm: h.rain?.["3h"] || 0,
    humidity: h.main.humidity
    }));

    fs.writeFileSync("data/weather.json", JSON.stringify({ hourly }, null, 2));
  console.log("✅ Weather data written to data/weather.json");
}

run();
