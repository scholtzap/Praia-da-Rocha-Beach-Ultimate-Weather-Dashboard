// script.js (Chart-based forecast visualization + date selector carousel)

let chartInstances = {};
let cachedTides = [];

async function loadWeather() {
  try {
    const res = await fetch('data/weather.json');
    const weather = await res.json();

    const tzOffsetMs = 2 * 60 * 60 * 1000; // GMT+2
    const now = new Date();
    // Calculate midnight today in GMT+2, then convert back to UTC for comparison
    const localNow = new Date(now.getTime() + tzOffsetMs);
    localNow.setUTCHours(0, 0, 0, 0); // Midnight in GMT+2 timezone
    const cutoff = new Date(localNow.getTime() - tzOffsetMs); // Convert back to UTC

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

  score += wind < 10 ? 10 : wind < 15 ? 8 : wind < 20 ? 6 : wind < 25 ? 4 : wind < 30 ? 2 : 0;
  score += rain === 0 ? 10 : rain < 0.5 ? 5 : rain < 1 ? 2 : 0;
  // score += clouds < 10 ? 4 : clouds < 70 ? 10 : 5;
  // score += uv < 3 ? 4 : uv <= 6 ? 10 : 6; // UVI not available from current OpenWeather API. *add one to division if added back in
  score += temp <= 2 ? 0 : temp <= 8 ? 2 : temp <= 12 ? 4 : temp <= 25 ? 10 : temp <= 30 ? 6 : temp <= 35 ? 4 : temp <= 40 ? 2 : 0;
  score += humidity < 80 ? 5 : 3; // Only counts 0.5 towards score compared to the rest

  score = Math.round(score / 3.5); // Normalize to 0-10 scale

  if (wind > 30 || rain > 1 || temp > 37 ) {
    score = 0; // Extreme conditions
  }

  return score
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
      document.querySelectorAll(".day-button").forEach(b => b.classList.remove("selected-day"));
      btn.classList.add("selected-day");

      renderDayCharts(entries);
      renderTideChart(cachedTides, dateKey);
      loadBusynessChart(dateKey);
    };

    container.appendChild(btn);
  });

  // Auto-select today if available
  const todayKey = new Date().toISOString().split("T")[0];
  const buttons = container.querySelectorAll(".day-button");

  if (buttons.length > 0) {
    buttons[0].classList.add("selected-day");
    const firstDateKey = Object.keys(dayGroups)[0];
    renderDayCharts(dayGroups[firstDateKey]);
    renderTideChart(cachedTides, firstDateKey);
    loadBusynessChart(firstDateKey);
  }
}

async function loadTides() {
  try {
    const res = await fetch('data/tides.json');
    const data = await res.json();
    return data.tides.map(t => ({
      time: new Date(t.time),
      height_m: t.height_m,
      type: t.type
    }));
  } catch (err) {
    console.error('Failed to load tide data:', err);
    return [];
  }
}

function renderBusynessChart(day) {
  fetch("data/busyness.json")
    .then((res) => res.json())
    .then((json) => {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const values = json.data[day.toLowerCase()] || [];

      const ctx = document.getElementById("busynessChart").getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: hours.map(h => `${h}:00`),
          datasets: [{
            label: "Busyness (%)",
            data: values,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, max: 100 },
            x: { title: { display: true, text: "Hour of Day" } }
          }
        }
      });
    });
}


function renderTideChart(tides, selectedDateStr) {
  const selectedDate = new Date(selectedDateStr);
  const start = new Date(selectedDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const extendedTides = [...tides].sort((a, b) => a.time - b.time);

  // Get surrounding points for interpolation
  const firstBefore = extendedTides.slice().reverse().find(t => t.time < start);
  const firstAfter = extendedTides.find(t => t.time >= end);

  // Select core day tides
  const dayTides = extendedTides.filter(t => t.time >= start && t.time < end);

  // Add edge points if found
  if (firstBefore) dayTides.unshift(firstBefore);
  if (firstAfter) dayTides.push(firstAfter);


  if (dayTides.length === 0) return;

  // Generate interpolated data every 15 minutes
  const interpolated = [];
  const stepMs = 15 * 60 * 1000;

  for (let i = 0; i < dayTides.length - 1; i++) {
    const t1 = dayTides[i];
    const t2 = dayTides[i + 1];

    const time1 = t1.time.getTime();
    const time2 = t2.time.getTime();
    const duration = time2 - time1;

    for (let t = time1; t <= time2; t += stepMs) {
      const phase = (t - time1) / duration; // 0 to 1
      const smoothHeight = sineInterp(t1.height_m, t2.height_m, phase);
      interpolated.push({
        time: new Date(t),
        height: smoothHeight
      });
    }
  }

  const values = interpolated.map(p => ({
    x: p.time,      // Date object
    y: p.height     // Tide height
  }));

  if (chartInstances["tideChart"]) chartInstances["tideChart"].destroy();
  const ctx = document.getElementById("tideChart").getContext("2d");

  chartInstances["tideChart"] = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Tide Height (m)",
          data: values, // now {x: Date, y: Number}
          borderColor: "#4fc3f7",
          backgroundColor: "rgba(33, 150, 243, 0.2)",
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 0,
          spanGaps: true
        }
      ]
    },
    options: {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'hour',
            displayFormats: {
              hour: 'HH:mm'
            },
            tooltipFormat: 'HH:mm'
          },
          title: {
            display: true,
            text: 'Time'
          },
          ticks: {
            source: 'auto',
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0
          }
        },
        y: {
          title: {
            display: true,
            text: "Height (m)"
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }

  });
}

// Sinusoidal interpolation for tidal approximation
function sineInterp(a, b, t) {
  return a + (b - a) * (0.5 - 0.5 * Math.cos(t * Math.PI));
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
      title: {display: true, text: 'Temperature (°C)'},
      beginAtZero: true
    },
    y1: {
      min: 0,
      max: 10,
      position: 'right',
      grid: { drawOnChartArea: false },
      title: {display: true, text: 'Playability'},
      ticks: { stepSize: 1 }
    }
  });

  const windMax = Math.max(20, Math.ceil(Math.max(...wind))); // Default max 20 kph

  drawChart('windHumidityChart', labels, [
    { label: 'Wind (kph)', data: wind, yAxisID: 'y', fill: true, tension: 0.3 },
    { label: 'Humidity (%)', data: humidity, yAxisID: 'y1', fill: false, tension: 0.3 }
  ], {
    y: { min: 0, title: {display: true, text: 'Wind Speed (km/h)'}, max: windMax },
    y1: { min: 0, title: {display: true, text: 'Humidity (%)'}, max: 100 }
  });

  const rainMax = Math.max(5, Math.ceil(Math.max(...rain))); // Default 5mm, or more if needed

  drawChart('rainCloudChart', labels, [
    { label: 'Rain (mm)', data: rain, yAxisID: 'y', fill: true, tension: 0.3 },
    { label: 'Cloud Cover (%)', data: clouds, yAxisID: 'y1', fill: false, tension: 0.3 }
  ], {
    y: { min: 0, title: {display: true, text: 'Rainfall (mm)'}, max: rainMax },
    y1: { min: 0, title: {display: true, text: 'Cloud Cover (%)'}, max: 100 }
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
  cachedTides = await loadTides();
  const todayStr = new Date().toISOString().split("T")[0];
  renderTideChart(cachedTides, todayStr);
});

let cachedBusyness = null;

async function loadBusynessData() {
  if (!cachedBusyness) {
    try {
      const res = await fetch("data/busyness.json");
      cachedBusyness = await res.json();
    } catch (err) {
      console.error("Failed to load busyness data:", err);
    }
  }
  return cachedBusyness;
}

async function loadBusynessChart(dateKey) {
  const data = await loadBusynessData();
  if (!data || !data.data) return;

  const dayName = new Date(dateKey).toLocaleDateString("en-ZA", { weekday: "long" }).toLowerCase();
  const dayData = data.data[dayName];
  if (!dayData) return;

  const chartId = "busynessChart";
  const ctx = document.getElementById(chartId).getContext("2d");

  const chartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [{
      label: `Busyness - ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}`,
      data: dayData,
      backgroundColor: "rgba(255, 193, 7, 0.5)",
      borderColor: "rgba(255, 193, 7, 1)",
      borderWidth: 1,
      fill: true,
    }]
  };

  if (chartInstances[chartId]) chartInstances[chartId].destroy();
  chartInstances[chartId] = new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: { display: true, text: "Estimated Popularity (%)" }
        }
      }
    }
  });
}
