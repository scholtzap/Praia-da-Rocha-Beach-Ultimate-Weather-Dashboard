// script.js (Chart-based forecast visualization + date selector carousel)

let chartInstances = {};

async function loadWeather() {
  try {
    const res = await fetch('data/weather.json');
    const weather = await res.json();

    const tzOffsetMs = 2 * 60 * 60 * 1000; // GMT+2
    const now = new Date();
    const cutoff = new Date(now.getTime() + tzOffsetMs);
    cutoff.setUTCHours(0, 0, 0, 0); // Start of today in GMT+2

    const futureHourly = weather.hourly
      .map(h => ({ ...h, date: new Date(h.dt * 1000) }))
      .filter(h => h.date >= cutoff); // only today and later

    const dailyGroups = groupByDay(futureHourly);
    renderDayCarousel(dailyGroups);

    const todayKey = new Date(cutoff).toISOString().split("T")[0];
    if (dailyGroups[todayKey]) {
      renderDayCharts(dailyGroups[todayKey]);
    }
  } catch (err) {
    console.error('Failed to load weather data:', err);
  }
}

function groupByDay(hourly) {
  const days = {};
  hourly.forEach(h => {
    const date = new Date(h.dt * 1000);
    const tzOffsetMs = 2 * 60 * 60 * 1000; // GMT+2
    const key = new Date(date.getTime() + tzOffsetMs).toISOString().split('T')[0];
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
  // score += uv < 3 ? 4 : uv <= 6 ? 10 : 6; // UVI not available from current OpenWeather API.
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
    const peakScore = Math.max(...entries.map(h => calculateFrisbeeScore(h)));

    const btn = document.createElement("button");
    btn.className = "day-button";
    btn.innerHTML = `<strong>${label}</strong><br/>Score: ${peakScore}/10`;
    btn.onclick = () => {
      // Remove previous highlights
      document.querySelectorAll(".day-button").forEach(b => b.classList.remove("selected-day"));
      btn.classList.add("selected-day");
      renderDayCharts(entries);
    };
    container.appendChild(btn);
  });

  // Auto-select today if available
  const todayKey = new Date().toISOString().split("T")[0];
  const todayBtn = container.querySelector(".day-button");
  if (todayBtn) todayBtn.classList.add("selected-day");
}

async function loadTides() {
  try {
    const res = await fetch('data/tides.json');
    const data = await res.json();
    return data.tides.map(t => ({
      time: new Date(t.time),
      type: t.type
    }));
  } catch (err) {
    console.error('Failed to load tide data:', err);
    return [];
  }
}

function renderTideChart(tides) {
  const labels = tides.map(t => t.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const values = tides.map(t => t.type === 'high' ? 1 : 0); // 1 for high, 0 for low

  if (chartInstances['tideChart']) chartInstances['tideChart'].destroy();

  const ctx = document.getElementById('tideChart').getContext('2d');
  chartInstances['tideChart'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Tide',
        data: values,
        tension: 0.3,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: values.map(v => v === 1 ? '#2196f3' : '#ffc107'),
        borderColor: '#999',
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        stepped: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          min: -0.1,
          max: 1.1,
          ticks: {
            callback: value => value === 1 ? 'High' : value === 0 ? 'Low' : '',
            stepSize: 1
          }
        }
      }
    }
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

  const playability = hourly.map(h => calculateFrisbeeScore(h));

  drawChart('tempUvChart', labels, [
    { label: 'Temperature (°C)', data: temp, yAxisID: 'y', fill: false, tension: 0.3 },
    { label: 'Playability Score', data: playability, yAxisID: 'y1', fill: false, tension: 0.3 }
  ], {
    y: {
      min: Math.min(...temp, 0),
      beginAtZero: true
    },
    y1: {
      min: 0,
      max: 10,
      position: 'right',
      grid: { drawOnChartArea: false },
      ticks: { stepSize: 1 }
    }
  });

  const windMax = Math.max(20, Math.ceil(Math.max(...wind))); // Default max 20 kph

  drawChart('windHumidityChart', labels, [
    { label: 'Wind (kph)', data: wind, yAxisID: 'y', fill: true, tension: 0.3 },
    { label: 'Humidity (%)', data: humidity, yAxisID: 'y1', fill: false, tension: 0.3 }
  ], {
    y: { min: 0, max: windMax },
    y1: { min: 0, max: 100 }
  });

  const rainMax = Math.max(5, Math.ceil(Math.max(...rain))); // Default 5mm, or more if needed

  drawChart('rainCloudChart', labels, [
    { label: 'Rain (mm)', data: rain, yAxisID: 'y', fill: true, tension: 0.3 },
    { label: 'Cloud Cover (%)', data: clouds, yAxisID: 'y1', fill: false, tension: 0.3 }
  ], {
    y: { min: 0, max: rainMax },
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

document.addEventListener('DOMContentLoaded', async () => {
  await loadWeather();
  const tides = await loadTides();
  renderTideChart(tides);
});

