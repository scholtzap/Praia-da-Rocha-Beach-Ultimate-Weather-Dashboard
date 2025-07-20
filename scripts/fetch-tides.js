const fs = require("fs");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const URL = "https://www.tide-forecast.com/locations/Cape-Town-South-Africa/tides/latest";

async function run() {
  const res = await fetch(URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  const tides = [];
  const year = new Date().getFullYear(); // add current year

  $('table.tide-table tbody tr').each((i, row) => {
    const cells = $(row).find("td");
    if (cells.length >= 4) {
      const dayText = $(cells[0]).text().trim(); // e.g. 'Sun 21 Jul'
      const timeText = $(cells[1]).text().trim(); // e.g. '3:46am'
      const heightText = $(cells[2]).text().trim(); // e.g. '1.52m'
      const typeText = $(cells[3]).text().toLowerCase();

      // Parse height
      const heightMatch = heightText.match(/([\d.]+)/);
      const height_m = heightMatch ? parseFloat(heightMatch[1]) : null;

      // Compose a full datetime string (e.g. '21 Jul 2025 03:46')
      const [_, day, month] = dayText.split(" "); // e.g. '21' 'Jul'
      const dateStr = `${day} ${month} ${year} ${timeText}`;
      const date = new Date(`${dateStr} GMT+2`);

      const type = typeText.includes("high") ? "high" : "low";

      if (!isNaN(date.getTime()) && height_m !== null) {
        tides.push({
          time: date.toISOString(),
          height_m,
          type
        });
      }
    }
  });

  fs.writeFileSync("data/tides.json", JSON.stringify({ tides }, null, 2));
  console.log(`✅ ${tides.length} tide entries written to data/tides.json`);
}

run();
