const fs = require("fs");
const puppeteer = require("puppeteer");

const TARGET_PLACE = "Clifton 4th Beach, Cape Town";

async function run() {
  console.log("🚀 Starting busyness scrape for:", TARGET_PLACE);

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(TARGET_PLACE)}`, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    await page.waitForSelector('[aria-label^="Popular times"]', { timeout: 15000 });

    const data = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('[aria-label^="Popular times"]'));
      const result = {};

      sections.forEach(section => {
        const day = section.getAttribute("aria-label").match(/Popular times on (\w+)/i)?.[1];
        const bars = Array.from(section.querySelectorAll('rect[height]'));
        const values = bars.map(bar => parseInt(bar.getAttribute("height")));
        if (day && values.length > 0) {
          result[day.toLowerCase()] = values;
        }
      });

      return result;
    });

    const today = new Date().toISOString().split("T")[0];
    const output = { updated: today, data };

    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync("data/busyness.json", JSON.stringify(output, null, 2));

    console.log("✅ busyness.json written successfully.");
    console.log("📊 Sample data preview:");
    Object.entries(data).forEach(([day, hours]) => {
      console.log(`  ${day}: ${hours.slice(8, 13).join(", ")} ...`);
    });

  } catch (err) {
    console.error("❌ Scraper error:", err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
