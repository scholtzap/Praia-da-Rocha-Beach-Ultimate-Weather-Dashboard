// script.js (Chart-based forecast visualization)

// Load and plot weather data for the full day (midnight to midnight)
async function loadWeather() {
  try {
    const res = await fetch('data/weather.json');
    const weather = await res.json();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const hourly = weather.hourly.filter(h => {
      const time = new Date(h.dt * 1000);
      return time >= startOfDay && time < endOfDay;
    });

    const labels = hourly.map(h => new Date(h.dt * 1000).getHours() + ':00');

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
      y1: { min: 0, max: 12 } // UV Index scale
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
  } catch (err) {
    console.error('Failed to load weather data:', err);
  }
}

function drawChart(canvasId, labels, datasets, axisOptions) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
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
