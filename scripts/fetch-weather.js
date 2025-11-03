const fs = require("fs");
const fetch = require("node-fetch");
const yaml = require("js-yaml");

// Read LOCATION environment variable (default to 'clifton')
const LOCATION = process.env.LOCATION || "clifton";
const API_KEY = process.env.OWM_API_KEY;

// Load configuration
const configFile = fs.readFileSync("config.yml", "utf8");
const config = yaml.load(configFile);

const locationConfig = config.locations[LOCATION];
if (!locationConfig) {
  console.error(`❌ Location "${LOCATION}" not found in config.yml`);
  process.exit(1);
}

const LAT = locationConfig.coordinates.weather_lat;
const LON = locationConfig.coordinates.weather_lon;

const URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${API_KEY}`;
const FILE = "data/weather.json";

async function run() {
  console.log(`🌍 Fetching weather data for ${locationConfig.name} (${LOCATION})`);
  console.log(`   Coordinates: ${LAT}, ${LON}`);

  const res = await fetch(URL);
  if (!res.ok) {
    console.error("Failed to fetch weather data:", res.status, await res.text());
    process.exit(1);
  }

  const apiData = await res.json();

  const newHourly = apiData.list.map(h => ({
    dt: h.dt,
    temp: h.main.temp,
    wind_speed: h.wind.speed,
    clouds: h.clouds.all,
    pop: h.pop || 0,
    rain_mm: h.rain?.["3h"] || 0,
    humidity: h.main.humidity
  }));

  // Load existing data
  let existing = { hourly: [] };
  try {
    existing = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (e) {
    console.warn("No existing data or failed to parse. Starting fresh.");
  }

  // Map old data by dt
  const existingMap = new Map(existing.hourly.map(h => [h.dt, h]));

  // Overwrite or insert with new data
  newHourly.forEach(h => {
    existingMap.set(h.dt, h); // replace or add
  });

  // Sort by dt ascending
  const merged = Array.from(existingMap.values()).sort((a, b) => a.dt - b.dt);

  fs.writeFileSync(FILE, JSON.stringify({ hourly: merged }, null, 2));
  console.log(`✅ Updated ${newHourly.length} entries and preserved past data`);
}

run();
