const fs = require("fs");
const puppeteer = require("puppeteer");

const TARGET_PLACE = "Clifton 4th Beach, Cape Town";

async function run() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Search Google Maps directly for the place
  await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(TARGET_PLACE)}`, {
    waitUntil: "networkidle2"
  });

  // Wait for the Popular times section to load
  await page.waitForSelector('[aria-label^="Popular times"]', { timeout: 15000 });

  const data = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('[aria-label^="Popular times"]'));
    const result = {};

    sections.forEach(section => {
      const day = section.getAttribute("aria-label").match(/Popular times on (\w+)/i)?.[1];
      const bars = Array.from(section.querySelectorAll('rect[height]'));
      const values = bars.map(bar => parseInt(bar.getAttribute("height")));
      if (day) {
        result[day.toLowerCase()] = values;
      }
    });

    return result;
  });

  await browser.close();

  const today = new Date().toISOString().split("T")[0];
  fs.writeFileSync("data/busyness.json", JSON.stringify({ updated: today, data }, null, 2));
  console.log("✅ Busyness data written.");
}

run().catch(console.error);
