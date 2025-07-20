// Frisbee Score weights
function calculateFrisbeeScore(data, time, tideData = null) {
  const wind = data.wind_speed;
  const rain = data.pop;
  const clouds = data.clouds;
  const temp = data.temp;
  const uv = data.uvi;

  let score = 0;

  // Wind score
  if (wind < 5) score += 2;
  else if (wind < 10) score += 10;
  else if (wind < 20) score += 8;
  else if (wind < 30) score += 5;
  else score += 2;

  // Rain score
  if (rain < 0.05) score += 10;
  else if (rain < 0.2) score += 8;
  else if (rain < 0.4) score += 5;
  else score += 2;

  // Clouds
  if (clouds < 10) score += 4;
  else if (clouds < 70) score += 10;
  else score += 5;

  // UV Index
  if (uv < 3) score += 4;
  else if (uv <= 6) score += 10;
  else score += 6;

  // Temp
  if (temp < 15) score += 4;
  else if (temp <= 28) score += 10;
  else score += 6;

  // Tide (optional)
  if (tideData) {
    const t = new Date(time * 1000);
    const closest = tideData.tides.find(td =>
      Math.abs(new Date(td.time).getTime() - t.getTime()) < 90 * 60 * 1000
    );
    if (closest) {
      score += closest.type === 'high' || closest.type === 'low' ? 5 : 8;
    } else {
      score += 7;
    }
  }

  return (score / 6).toFixed(1); // Out of 10
}

async function loadData() {
  const [weatherRes, tideRes] = await Promise.all([
    fetch('data/weather.json'),
    fetch('data/tides.json')
  ]);

  const weatherData = await weatherRes.json();
  const tideData = await tideRes.json();

  const now = new Date();
  const hourly = weatherData.hourly.slice(0, 12); // next 12 hours

  // Display current score
  const currentHour = hourly[0];
  const score = calculateFrisbeeScore(currentHour, currentHour.dt, tideData);
  document.getElementById("current-score").textContent = `Frisbee Score: ${score}/10`;

  // Hourly forecast
  const grid = document.getElementById("forecast-grid");
  hourly.forEach(hour => {
    const time = new Date(hour.dt * 1000).getHours();
    const s = calculateFrisbeeScore(hour, hour.dt, tideData);

    const div = document.createElement("div");
    div.className = "forecast-hour";
    div.innerHTML = `
      <strong>${time}:00</strong><br>
      🌡 ${hour.temp.toFixed(1)}°C<br>
      💨 ${hour.wind_speed} kph<br>
      ☁️ ${hour.clouds}%<br>
      ☔ ${Math.round(hour.pop * 100)}%<br>
      🔆 UV: ${hour.uvi}<br>
      🥏 Score: ${s}
    `;
    grid.appendChild(div);
  });
}

loadData();
