# Clifton Beach Frisbee Weather Dashboard (Version 3.0) – Specification

## 1. Project Goal
A single-page web application hosted on GitHub Pages to display real-time and multi-day hourly forecasts for frisbee playability at Clifton 4th Beach, Cape Town. The dashboard calculates a "Frisbee Score" based on live weather, tide data, and busyness estimates.

---

## 2. System Architecture

| Layer             | Tech Used                             | Purpose                                      |
|------------------|----------------------------------------|----------------------------------------------|
| Frontend         | HTML, CSS, Vanilla JavaScript          | Single-page responsive dashboard             |
| Hosting          | GitHub Pages                           | Static hosting of frontend assets            |
| Backend Fetch    | GitHub Actions (JavaScript)            | Fetch weather and tide data on a schedule    |
| Data Storage     | \`data/weather.json\`, \`data/tides.json\` | Stored in repo for frontend access           |

---

## 3. Data Sources

### 3.1 Weather (OpenWeatherMap)
- API: One Call 3.0
- Updates hourly via GitHub Actions
- Stored as: \`data/weather.json\`

### 3.2 Tide Data
- Primary: Windfinder embedded tide JSON
- Scraped daily via GitHub Actions
- Output: \`data/tides.json\`
- Fallback sources planned: tiderime.org, tideking.com, seatemperature.org

### 3.3 Busyness Estimates
- Currently hardcoded or image-based
- Future: Google Maps Popular Times or crowdsourced

---

## 4. Frontend Layout & Features

### 4.1 Section 1: Live View & Current Conditions
- Live webcam (YouTube embed)
- Hourly Frisbee Score
- Current temp, wind, rain, UV, etc.
- Unit toggle (metric/imperial)

### 4.2 Section 2: Hourly Forecast Table
- Scrollable with day selector
- Hourly data (temp, wind, rain, UV, Frisbee Score)

### 4.3 Section 3: Daily Summary
- Sunrise/sunset
- Tide info
- Busyness bar
- Windy.com map

---

## 5. Frisbee Score Calculation

### Inputs:
- \`weather.json\`: hourly temp, wind, clouds, UV, rain
- \`tides.json\`: high/low tide events

### Weights:

| Factor      | Weight | Ideal Conditions                        |
|-------------|--------|-----------------------------------------|
| Wind        | 40%    | 5–20 kph                                |
| Rain        | 25%    | 0–10% probability                       |
| Cloud Cover | 10%    | 20–60%                                  |
| UV Index    | 10%    | 3–6                                     |
| Temperature | 10%    | 20–28°C                                 |
| Tide        | 5%     | Mid-tide preferred                      |

---

## 6. GitHub Actions Workflow

### Trigger:
- Runs hourly (\`cron: 0 * * * *\`)
- Manual trigger also supported

### Steps:
- Fetch weather from OWM
- Scrape tide data from Windfinder
- Write to \`data/\` folder
- Commit & push changes to repo

### Secrets:
- \`OWM_API_KEY\`: stored in GitHub Secrets

---

## 7. Hosting on GitHub Pages

- Repo serves all frontend assets statically
- \`data/\` contains JSON files updated via Action
- Pages automatically re-deploy with data changes

---

## 8. Future Improvements

- Fallback tide scrapers (TideKing, etc.)
- Real busyness estimate via scraping
- Share links, alerts (e.g. score > 8)
- Progressive Web App support
- Component breakdown in score tooltips
