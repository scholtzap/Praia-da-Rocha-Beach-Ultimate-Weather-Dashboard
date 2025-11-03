const fs = require("fs");
const yaml = require("js-yaml");

// Read LOCATION environment variable (default to 'clifton')
const LOCATION = process.env.LOCATION || "clifton";

// Load configuration
const configFile = fs.readFileSync("config.yml", "utf8");
const config = yaml.load(configFile);

const loc = config.locations[LOCATION];
if (!loc) {
  console.error(`❌ Location "${LOCATION}" not found in config.yml`);
  process.exit(1);
}

console.log(`🏗️  Building index.html for ${loc.name} (${LOCATION})`);

// Build additional embeds HTML
let additionalEmbedsHTML = "";
if (loc.additional_embeds && loc.additional_embeds.length > 0) {
  loc.additional_embeds.forEach(embed => {
    if (embed.type === "windy_webcam") {
      additionalEmbedsHTML += `
  <!-- Windy Webcam Embed -->
  <div class="iframe-container">
    <a
      name="windy-webcam-timelapse-player"
      data-id="${embed.id}"
      data-play="lifetime"
      data-loop="0"
      data-auto-play="0"
      data-force-full-screen-on-overlay-play="0"
      data-interactive="1"
      href="https://windy.com/webcams/${embed.id}"
      target="_blank"
    >
      Portimão: Praia da Rocha – Windy Webcam
    </a>
    <script
      async
      type="text/javascript"
      src="https://webcams.windy.com/webcams/public/embed/v2/script/player.js"
    ></script>
  </div>
`;
    }
  });
}

// Build beachcam button HTML
let beachcamHTML = "";
if (loc.beachcam_url) {
  beachcamHTML = `
<section class="card">
  <!-- Beachcam.meo.pt Button -->
  <div class="iframe-container" style="text-align: center; margin-top: 1rem;">
    <a
      href="${loc.beachcam_url}"
      target="_blank"
      style="display: inline-block; background-color: #0077cc; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;"
    >
      🌊 View ${loc.name} Beachcam
    </a>
  </div>
</section>
`;
}

// Build WhatsApp section HTML
let whatsappHTML = "";
if (loc.whatsapp_form) {
  whatsappHTML = `
    <section class="card">
      <h4>Join the WhatsApp Group</h4>
      <p>Use the link below to request access to our group:</p>
      <a class="whatsapp-button" href="${loc.whatsapp_form}" target="_blank">
        📲 Request Access via Google Form
      </a>
    </section>
`;
}

// Generate the full HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${loc.title}</title>
  <link rel="stylesheet" href="style.css" />
</head>

<!-- Floating Buy Me a Coffee Button (Smaller Version) -->
<a href="https://www.buymeacoffee.com/propagation" target="_blank" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
">
  <img
    src="https://img.buymeacoffee.com/button-api/?text=Buy me a plant or a coffee&emoji=🌵&slug=propagation&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff"
    alt="Buy me a plant or a coffee"
    style="width: 200px; height: auto;"
  >
</a>

<body>
  <header>
    <h1>${loc.title}</h1>
    <p id="current-summary"></p>
  </header>

<section class="card dual-iframe">
  <!-- YouTube Live Stream -->
  <div class="iframe-container">
    <iframe
      width="100%"
      height="300"
      src="${loc.youtube_url}"
      frameborder="0"
      allowfullscreen
    ></iframe>
  </div>
${additionalEmbedsHTML}
  <!-- Windy Weather Map -->
  <div class="iframe-container">
    <iframe
      width="100%"
      height="450"
      src="${loc.windy_embed}"
      frameborder="0"
    ></iframe>
  </div>
</section>
${beachcamHTML}
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>

<section class="card">
  <div id="day-carousel" class="day-selector"></div>
</section>

<section class="card">
  <h4>Temperature & Playability</h4>
  <canvas id="tempUvChart" height="120"></canvas>
</section>

<section class="card">
  <h4>Rainfall & Cloud Cover</h4>
  <canvas id="rainCloudChart" height="120"></canvas>
</section>

<section class="card">
  <h4>Wind Speed & Humidity</h4>
  <canvas id="windHumidityChart" height="120"></canvas>
</section>

<section class="card">
  <h4>Tide Levels (High/Low)</h4>
  <canvas id="tideChart" height="120"></canvas>
</section>

<section class="card">
  <h4>Estimated Busyness</h4>
  <canvas id="busynessChart" height="120"></canvas>
</section>

<footer>
${whatsappHTML}
  <section class="card">
    <h3>Share the Dashboard</h3>
    <p>Spread the word and share with friends:</p>
    <div class="social-share-buttons">
      <a href="${loc.share_urls.twitter}" target="_blank">🐦 Twitter</a>
      |
      <a href="${loc.share_urls.facebook}" target="_blank">📘 Facebook</a>
      |
      <a href="${loc.share_urls.linkedin}" target="_blank">💼 LinkedIn</a>
    </div>
  </section>
</footer>

<script src="script.js"></script>

</body>

<style>
  body {
    padding-bottom: 70px; /* Adjust as needed */
  }
</style>

</html>
`;

// Write the HTML file
fs.writeFileSync("index.html", html);
console.log(`✅ Generated index.html for ${loc.name}`);
