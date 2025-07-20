const fs = require("fs");
const fetch = require("node-fetch");

const API_KEY = process.env.STORMGLASS_API_KEY;
const LAT = -33.9258;
const LON = 18.4232;
const FILE = "data/tides.json";

async function run() {
  const end = new Date();
  const start = new Date();
  end.setDate(end.getDate() + 5); // 5-day forecast

  const isoStart = start.toISOString();
  const isoEnd = end.toISOString();

  const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${LAT}&lng=${LON}&start=${isoStart}&end=${isoEnd}`;

  const res = await fetch(url, {
    headers: {
      Authorization: API_KEY
    }
  });

  if (!res.ok) {
    console.error("❌ Failed to fetch tides:", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();

  const newTides = data.data.map(t => ({
    time: t.time,
    height_m: t.height,
    type: t.type // "high" or "low"
  }));

  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(FILE, "utf8")).tides || [];
  } catch (e) {
    existing = [];
  }

  // Deduplicate by ISO timestamp and type
  const map = new Map(existing.map(t => [t.time + "-" + t.type, t]));
  newTides.forEach(t => map.set(t.time + "-" + t.type, t));

  const combined = Array.from(map.values()).sort((a, b) => new Date(a.time) - new Date(b.time));

  fs.writeFileSync(FILE, JSON.stringify({ tides: combined }, null, 2));
  console.log(`✅ Appended and saved ${newTides.length} tide entries to ${FILE}`);
}

run();
