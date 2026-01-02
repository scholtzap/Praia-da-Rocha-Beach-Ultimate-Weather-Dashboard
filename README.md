# Beach Ultimate Weather Dashboard - Unified Multi-Location System

A unified codebase for managing multiple beach weather dashboards. Currently supports:
- **Clifton Beach** (Cape Town, South Africa)
- **Praia da Rocha** (Portimão, Portugal)

This system uses a single configuration file to manage all location-specific settings, making it easy to add new locations or maintain existing ones.

## Architecture

The unified system consists of:
- **`config.yml`**: Central configuration file with all location-specific settings
- **Unified fetch scripts**: Location-agnostic data fetching scripts
- **Build script**: Generates location-specific HTML from configuration
- **GitHub Actions workflows**: Automated data updates using environment variables

## Setup for Each Location

### 1. Fork or Clone This Repository

For each location, create a separate repository or branch:
```bash
# For Clifton
git clone https://github.com/scholtzap/beach-ultimate-weather-dashboard.git Clifton-Beach-Frisbee-Weather-Dashboard

# For Praia da Rocha
git clone https://github.com/scholtzap/beach-ultimate-weather-dashboard.git Praia-da-Rocha-Beach-Ultimate-Weather-Dashboard
```

### 2. Configure GitHub Repository Variables

In your GitHub repository, go to **Settings > Secrets and variables > Actions > Variables** and add:

**Variable Name:** `LOCATION`
**Value:** `clifton` or `praia` (depending on the location)

### 3. Configure GitHub Repository Secrets

In **Settings > Secrets and variables > Actions > Secrets**, add the following secrets:

#### Required for All Locations:
- `OWM_API_KEY`: OpenWeatherMap API key ([get one here](https://openweathermap.org/api))
- `STORMGLASS_API_KEY`: StormGlass API key for tide data ([get one here](https://stormglass.io/))
- `GOOGLE_API_KEY`: Google Places API key ([get one here](https://developers.google.com/maps/documentation/places/web-service/get-api-key))

**Note:** Google Place IDs are now configured in `config.yml` rather than as repository secrets.

### 4. Enable GitHub Pages

1. Go to **Settings > Pages**
2. Under **Source**, select **Deploy from a branch**
3. Select the **main** (or **master**) branch
4. Set folder to **/ (root)**
5. Click **Save**

Your dashboard will be available at: `https://[username].github.io/[repository-name]/`

## Configuration File Structure

The `config.yml` file contains all location-specific settings:

```yaml
locations:
  clifton:
    name: "Clifton Beach Frisbee"
    title: "Clifton Beach Frisbee Weather"
    google_place_id: "YOUR_CLIFTON_PLACE_ID"
    coordinates:
      weather_lat: -33.9509
      weather_lon: 18.3774
      tides_lat: -33.9258
      tides_lon: 18.4232
      windy_lat: -33.957
      windy_lon: 18.377
    youtube_url: "https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID&autoplay=1&mute=1"
    youtube_search:  # Optional: For channels with multiple streams
      enabled: true
      channel_id: "CHANNEL_ID"
      title_contains: "Stream title keywords"
    windy_embed: "https://embed.windy.com/..."
    # ... more settings
```

## How It Works

### When GitHub Actions Run:

1. **Reads LOCATION variable** from repository variables
2. **Loads config.yml** and extracts settings for that location
3. **Builds HTML** using `scripts/build-html.js` with location-specific content
4. **Fetches data** using location-specific coordinates:
   - Weather from OpenWeatherMap
   - Tides from StormGlass
   - Busyness from Google Popular Times
5. **Commits updates** back to the repository
6. **GitHub Pages** automatically deploys the updated site

### Local Development

```bash
# Install dependencies
npm install

# Set location (clifton or praia)
export LOCATION=clifton

# Build HTML for the location
npm run build

# Fetch data (requires API keys in environment)
export OWM_API_KEY=your_key_here
export STORMGLASS_API_KEY=your_key_here
npm run fetch:weather
npm run fetch:tides

# Or fetch all data
npm run fetch:all
```

## Adding a New Location

1. **Update `config.yml`** with the new location's settings:
```yaml
locations:
  new_location:
    name: "New Beach Name"
    title: "New Beach Weather Dashboard"
    coordinates:
      weather_lat: XX.XXXX
      weather_lon: XX.XXXX
      # ... etc
```

2. **Create a new repository** for the location

3. **Set the `LOCATION` variable** to `new_location` in GitHub repository variables

4. **Add API secrets** to the repository

5. **Enable GitHub Pages**

That's it! The unified codebase will handle the rest.

## File Structure

```
beach-ultimate-weather-dashboard/
├── config.yml                 # Central configuration for all locations
├── deploy-all.sh              # 🚀 One-command deployment script
├── package.json               # Node dependencies
├── index.html                 # Generated (by build script)
├── style.css                  # Shared styles
├── script.js                  # Shared JavaScript
├── docker-compose.yml         # Docker configuration for both locations
├── Dockerfile                 # Production Docker image
├── Dockerfile.dev             # Development Docker image
├── Dockerfile.fetcher         # Data fetching Docker image
├── README.md                  # Main documentation (this file)
├── DEPLOYMENT.md              # Deployment guide
├── MULTI-REPO-WORKFLOW.md     # Multi-repository workflow guide
├── scripts/
│   ├── build-html.js         # HTML generator
│   ├── fetch-weather.js      # Weather data fetcher
│   ├── fetch-tides.js        # Tide data fetcher
│   └── fetch-busyness.py     # Busyness data fetcher
├── data/
│   ├── clifton/              # Clifton location data
│   │   ├── weather.json      # Weather data
│   │   ├── tides.json        # Tide data
│   │   └── busyness.json     # Busyness data
│   └── praia/                # Praia location data
│       ├── weather.json      # Weather data
│       ├── tides.json        # Tide data
│       └── busyness.json     # Busyness data
└── .github/
    └── workflows/
        ├── update-data.yml   # Weather fetch workflow
        ├── fetch-tides.yml   # Tide fetch workflow
        └── fetch-busyness.yml # Busyness fetch workflow
```

## Workflows Schedule

- **Weather Data**: Every 3 hours
- **Tide Data**: Daily at 6:15 AM
- **Busyness Data**: Every 6 hours

All workflows can also be triggered manually via **Actions > [Workflow Name] > Run workflow**.

## Troubleshooting

### Workflow Fails with "Location not found"
- Check that the `LOCATION` variable in repository settings matches a key in `config.yml`

### No data appearing on dashboard
- Verify all API keys are correctly set in repository secrets
- Check workflow runs in the **Actions** tab for errors
- Ensure `data/` directory contains the JSON files

### HTML not updating
- Make sure the `update-data.yml` workflow includes `index.html` in the commit step
- Run the build script manually: `npm run build`

## Future Enhancements

Possible additions to the unified system:
- Automatic sitemap generation
- Multi-language support
- Dark mode toggle
- Email notifications for optimal conditions
- Historical data analysis

## Contributing

To contribute improvements to the unified codebase:
1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Test with both locations
5. Submit a pull request

## Multi-Repository Deployment (Recommended)

This project is designed to deploy as **multiple independent repositories**, one per location. This allows each location to have its own GitHub Pages deployment and automated workflows.

### 🚀 Quick Start: Deploy to Both Repos

The easiest way to deploy changes to all locations:

```bash
cd /mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard
./deploy-all.sh "Your commit message"
```

This automatically:
1. Copies updated config to both deployment repos
2. Builds location-specific HTML for each
3. Commits and pushes to both repositories
4. Triggers GitHub Pages deployment for both sites

**Example:**
```bash
./deploy-all.sh "Update YouTube embed URLs"
```

### Repository Setup

The multi-repo structure consists of:
- **Main source repository** (this repo): Contains shared code and config.yml
- **Clifton deployment repo** (`/tmp/clifton-deploy`): Deploys to GitHub Pages
- **Praia deployment repo** (`/tmp/praia-deploy`): Deploys to GitHub Pages

Each deployment repo:
- Has its own `LOCATION` variable in GitHub settings
- Runs automated workflows to fetch data
- Deploys independently via GitHub Pages

### Manual Deployment

For detailed deployment workflows or single-location updates, see:
- **[MULTI-REPO-WORKFLOW.md](./MULTI-REPO-WORKFLOW.md)** - Complete multi-repo management guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - GitHub Pages and Docker deployment guide

## Docker Deployment

This project includes Docker support for running both dashboards locally or in production.

### Quick Docker Start

```bash
# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Run both locations
docker-compose up -d

# Clifton: http://localhost:8080
# Praia:   http://localhost:8081
```

Or use the Makefile:

```bash
make setup  # Create .env file
make up     # Start all services
make logs   # View logs
```

### Docker Architecture

The project uses three Dockerfiles:
- **`Dockerfile`** - Production multi-stage build with nginx
- **`Dockerfile.dev`** - Development environment with live code mounting
- **`Dockerfile.fetcher`** - Data fetching service with Python and Node.js

Data is stored in location-specific directories (`data/clifton/` and `data/praia/`) and mounted to containers as read-only volumes.

## License

MIT License - Feel free to use this for your own beach weather dashboards!
