const fs = require("fs");
const puppeteer = require("puppeteer");

const TARGET_PLACE = "Clifton 3rd Beach, Cape Town";

async function run() {
  console.log("🚀 Starting busyness scrape for:", TARGET_PLACE);

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    // Go to Google Maps search page
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(TARGET_PLACE)}`, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    // Wait for Popular Times blocks to load
    await page.waitForSelector('div[aria-label^="Popular times on"]', { timeout: 15000 });

    const data = await page.evaluate(() => {
      const result = {};
      const elements = Array.from(document.querySelectorAll('div[aria-label^="Popular times on"]'));

      elements.forEach(el => {
        const label = el.getAttribute("aria-label");

        // e.g. "Popular times on Saturday at 1 PM is 96% busy"
        const match = label.match(/Popular times on (\w+) at (\d+)(?:\s?([AP]M))? is (\d+)% busy/i);
        if (!match) return;

        const [_, day, hourStr, ampm, percentStr] = match;

        let hour = parseInt(hourStr, 10);
        if (ampm?.toUpperCase() === "PM" && hour !== 12) hour += 12;
        if (ampm?.toUpperCase() === "AM" && hour === 12) hour = 0;

        const weekday = day.toLowerCase();
        if (!result[weekday]) result[weekday] = Array(24).fill(null);
        result[weekday][hour] = parseInt(percentStr, 10);
      });

      return result;
    });

    if (Object.keys(data).length === 0) {
      throw new Error("Popular times data not found — layout may have changed.");
    }

    const today = new Date().toISOString().split("T")[0];
    const output = { updated: today, data };

    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync("data/busyness.json", JSON.stringify(output, null, 2));

    console.log("✅ busyness.json written successfully.");
    console.log("📊 Sample preview:");
    Object.entries(data).forEach(([day, hours]) => {
      console.log(`  ${day}:`, hours.map(v => v ?? "-").slice(9, 14).join(", "), "...");
    });

  } catch (err) {
    console.error("❌ Error while scraping:", err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
