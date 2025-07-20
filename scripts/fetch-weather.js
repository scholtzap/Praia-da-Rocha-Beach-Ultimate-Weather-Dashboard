const fs = require("fs");
const fetch = require("node-fetch");

const API_KEY = process.env.OWM_API_KEY;
const LAT = -33.9509;
const LON = 18.3774;

const URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${API_KEY}`;
const FILE = "data/weather.json";

async function run() {
  const res = await fetch(URL);
  if (!res.ok) {
    console.error("Failed to fetch weather data:", res.status, await res.text());
    process.exit(1);
  }

  const newData = await res.json();

  const newHourly = newData.list.map(h => ({
    dt: h.dt,
    temp: h.main.temp,
    wind_speed: h.wind.speed,
    clouds: h.clouds.all,
    pop: h.pop || 0,
    rain_mm: h.rain?.["3h"] || 0,
    humidity: h.main.humidity
  }));

  let combined = [];
  try {
    const existing = JSON.parse(fs.readFileSync(FILE, "utf8"));
    const existingMap = new Map(existing.hourly.map(h => [h.dt, h]));
    newHourly.forEach(h => existingMap.set(h.dt, h)); // overwrites existing or appends new
    combined = Array.from(existingMap.values()).sort((a, b) => a.dt - b.dt);
  } catch (e) {
    combined = newHourly;
  }

  fs.writeFileSync(FILE, JSON.stringify({ hourly: combined }, null, 2));
  console.log("✅ Appended and saved weather data to data/weather.json");
}

run();
