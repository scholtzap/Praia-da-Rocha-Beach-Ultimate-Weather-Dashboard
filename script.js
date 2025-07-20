// script.js (Chart-based forecast visualization + date selector carousel)

let chartInstances = {};

async function loadWeather() {
  try {
    const res = await fetch('data/weather.json');
    const weather = await res.json();

    const dailyGroups = groupByDay(weather.hourly);
    renderDayCarousel(dailyGroups);

    // Initially load today
    const today = new Date().toISOString().split('T')[0];
    if (dailyGroups[today]) {
      renderDayCharts(dailyGroups[today]);
    }
  } catch (err) {
    console.error('Failed to load weather data:', err);
  }
}

function groupByDay(hourly) {
  const days = {};
  hourly.forEach(h => {
    const date = new Date(h.dt * 1000);
    const key = date.toISOString().split('T')[0];
    if (!days[key]) days[key] = [];
    days[key].push({ ...h, date });
  });
  return days;
}

function calculateFrisbeeScore(h) {
  let score = 0;
  const wind = h.wind_speed;
  const rain = h.rain_mm;
  const clouds = h.clouds;
  const temp = h.temp;
  const uv = h.uvi;
  const humidity = h.humidity;

  const hour = h.date.getHours();
  const sunrise = h.sunrise ? new Date(h.sunrise * 1000).getHours() : 6;
  const sunset = h.sunset ? new Date(h.sunset * 1000).getHours() : 19;
  const isDaylight = hour >= sunrise && hour <= sunset;
  if (!isDaylight) return 0;

  score += wind < 5 ? 2 : wind < 10 ? 10 : wind < 20 ? 8 : wind < 30 ? 5 : 2;
  score += rain === 0 ? 10 : rain < 0.5 ? 7 : rain < 1 ? 5 : 2;
  score += clouds < 10 ? 4 : clouds < 70 ? 10 : 5;
  score += uv < 3 ? 4 : uv <= 6 ? 10 : 6;
  score += temp < 15 ? 4 : temp <= 28 ? 10 : 6;
  score += humidity < 100 ? 8 : 5;

  return Math.round(score / 6);
}

function renderDayCarousel(dayGroups) {
  const container = document.getElementById("day-carousel");
  container.innerHTML = "";
  Object.entries(dayGroups).forEach(([dateKey, entries]) => {
    const date = new Date(dateKey);
    const weekday = date.toLocaleDateString("en-ZA", { weekday: "short" });
    const label = `${weekday}, ${date.getDate()}/${date.getMonth() + 1}`;
    const scoreAvg = Math.round(entries.reduce((s, h) => s + calculateFrisbeeScore(h), 0) / entries.length);

    const btn = document.createElement("button");
    btn.className = "day-button";
    btn.innerHTML = `<strong>${label}</strong><br/>Score: ${scoreAvg}/10`;
    btn.onclick = () => renderDayCharts(entries);
    container.appendChild(btn);
  });
}

function renderDayCharts(hourly) {
  const labels = hourly.map(h => h.date.getHours() + ':00');

  const temp = hourly.map(h => h.temp);
  const uvi = hourly.map(h => h.uvi);
  const wind = hourly.map(h => h.wind_speed);
  const humidity = hourly.map(h => h.humidity);
  const rain = hourly.map(h => h.rain_mm);
  const clouds = hourly.map(h => h.clouds);

  drawChart('tempUvChart', labels, [
    { label: 'Temperature (°C)', data: temp, yAxisID: 'y' },
    { label: 'UV Index', data: uvi, yAxisID: 'y1' }
  ], {
    y: { min: Math.min(...temp, 0), beginAtZero: true },
    y1: { min: 0, max: 12 }
  });

  drawChart('windHumidityChart', labels, [
    { label: 'Wind (kph)', data: wind, yAxisID: 'y' },
    { label: 'Humidity (%)', data: humidity, yAxisID: 'y1' }
  ], {
    y: { min: 0 },
    y1: { min: 0, max: 100 }
  });

  drawChart('rainCloudChart', labels, [
    { label: 'Rain (mm)', data: rain, yAxisID: 'y' },
    { label: 'Cloud Cover (%)', data: clouds, yAxisID: 'y1' }
  ], {
    y: { min: 0 },
    y1: { min: 0, max: 100 }
  });
}

function drawChart(canvasId, labels, datasets, axisOptions) {
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }
  const ctx = document.getElementById(canvasId).getContext('2d');
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      stacked: false,
      plugins: { title: { display: false } },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          ticks: { beginAtZero: true },
          ...axisOptions?.y
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { beginAtZero: true },
          ...axisOptions?.y1
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', loadWeather);
