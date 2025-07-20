// script.js (Chart-based forecast visualization)

// Load and plot weather data
async function loadWeather() {
  try {
    const res = await fetch('data/weather.json');
    const weather = await res.json();

    const hourly = weather.hourly.slice(0, 12);
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
    ]);

    drawChart('windHumidityChart', labels, [
      { label: 'Wind (kph)', data: wind, yAxisID: 'y' },
      { label: 'Humidity (%)', data: humidity, yAxisID: 'y1' }
    ]);

    drawChart('rainCloudChart', labels, [
      { label: 'Rain (mm)', data: rain, yAxisID: 'y' },
      { label: 'Cloud Cover (%)', data: clouds, yAxisID: 'y1' }
    ]);
  } catch (err) {
    console.error('Failed to load weather data:', err);
  }
}

function drawChart(canvasId, labels, datasets) {
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
          ticks: { beginAtZero: true }
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { beginAtZero: true }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', loadWeather);
