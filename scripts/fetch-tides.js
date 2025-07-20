const fs = require("fs");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const URL = "https://www.windfinder.com/tide/cape_town_sea_point";

async function run() {
  const res = await fetch(URL);
  const html = await res.text();

  const $ = cheerio.load(html);
  const tides = [];

  $(".tide-day").each((i, el) => {
    const day = $(el).find(".tide-day__header").text().trim();
    $(el)
      .find(".tide-day__tide-list .tide-day__tide-item")
      .each((_, item) => {
        const timeText = $(item).find(".tide-day__tide-time").text().trim();
        const heightText = $(item).find(".tide-day__tide-height").text().trim();
        const type = $(item).find(".tide-day__tide-icon").attr("class").includes("high") ? "high" : "low";

        const timeStr = `${day} ${timeText}`;
        const date = new Date(`${timeStr} GMT+2`);

        const heightMatch = heightText.match(/([\d.]+)/);
        const height = heightMatch ? parseFloat(heightMatch[1]) : null;

        if (!isNaN(date.getTime()) && height !== null) {
          tides.push({
            time: date.toISOString(),
            height_m: height,
            type
          });
        }
      });
  });

  fs.writeFileSync("data/tides.json", JSON.stringify({ tides }, null, 2));
  console.log("✅ Tides written to data/tides.json");
}

run();
