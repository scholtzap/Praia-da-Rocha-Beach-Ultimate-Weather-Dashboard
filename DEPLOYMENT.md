# Deployment Guide

This guide explains how to deploy the unified Beach Ultimate Weather Dashboard.

## Overview

The Beach Ultimate Weather Dashboard uses a **multi-repository deployment strategy**:
- **One source repository** containing shared code and `config.yml`
- **Separate deployment repositories** for each location (Clifton and Praia)
- Each deployment repo has its own GitHub Pages site and automated workflows

## Deployment Options

### Option 1: Multi-Repository Deployment (Recommended)

This is the **recommended approach** for managing multiple location dashboards from a single source.

#### 🚀 Quick Deploy to All Locations

```bash
cd /mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard
./deploy-all.sh "Your commit message"
```

This script:
1. Copies `config.yml` to `/tmp/clifton-deploy` and `/tmp/praia-deploy`
2. Builds location-specific `index.html` for each
3. Commits and pushes changes to both GitHub repositories
4. Triggers automatic GitHub Pages deployment

**Example:**
```bash
./deploy-all.sh "Update YouTube embed URLs"
```

#### Setup Multi-Repository Deployment

**Prerequisites:**
- Clone deployment repos to `/tmp/clifton-deploy` and `/tmp/praia-deploy`
- Each deployment repo configured with GitHub Pages enabled
- Git authentication configured (Windows Credential Manager or SSH)

**Directory Structure:**
```
/mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard/
├── config.yml           # Master configuration
├── deploy-all.sh        # Deployment script
├── scripts/
└── ...

/tmp/clifton-deploy/     # Git: scholtzap/Clifton-Beach-Frisbee-Weather-Dashboard
/tmp/praia-deploy/       # Git: scholtzap/Praia-da-Rocha-Beach-Ultimate-Weather-Dashboard
```

**For detailed multi-repo workflows, see [MULTI-REPO-WORKFLOW.md](./MULTI-REPO-WORKFLOW.md)**

### Option 2: Single Repository GitHub Pages

This is the primary deployment method for hosting dashboards publicly.

1. **Fork or use this repository**

2. **Set up GitHub repository variable:**
   - Go to **Settings > Secrets and variables > Actions > Variables**
   - Add variable: `LOCATION` with value `clifton` or `praia`

3. **Configure GitHub repository secrets:**
   In **Settings > Secrets and variables > Actions > Secrets**, add:
   - `OWM_API_KEY` - OpenWeatherMap API key
   - `STORMGLASS_API_KEY` - StormGlass API key
   - `GOOGLE_API_KEY` - Google Places API key

   **Note:** Google Place IDs are configured in `config.yml`, not as secrets.

4. **Enable GitHub Pages:**
   - Go to **Settings > Pages**
   - Under **Source**, select **Deploy from a branch**
   - Select the **main** branch
   - Set folder to **/ (root)**
   - Click **Save**

5. **Trigger initial workflows:**
   - Go to **Actions** tab
   - Manually run each workflow to populate initial data

Your dashboard will be available at: `https://[username].github.io/[repository-name]/`

**Live Deployments:**
- Clifton: https://scholtzap.github.io/Clifton-Beach-Frisbee-Weather-Dashboard/
- Praia: https://scholtzap.github.io/Praia-da-Rocha-Beach-Ultimate-Weather-Dashboard/

### Option 3: Deploy with Docker

For local or self-hosted deployment using Docker containers.

1. **Clone this repository:**
   ```bash
   git clone https://github.com/scholtzap/beach-ultimate-weather-dashboard.git
   cd beach-ultimate-weather-dashboard
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start services:**
   ```bash
   # Start both locations
   docker-compose up -d

   # Or start individual locations
   docker-compose up -d clifton
   docker-compose up -d praia
   ```

4. **Access dashboards:**
   - Clifton: http://localhost:8080
   - Praia: http://localhost:8081

See the main README.md for more Docker commands and options.

## What Happens After Deployment

1. **GitHub Actions workflows** will run on their schedules:
   - Weather data: Every 3 hours
   - Tide data: Daily at 6:15 AM
   - Busyness data: Every 6 hours

2. **Each workflow will:**
   - Read the `LOCATION` variable
   - Build location-specific HTML
   - Fetch data for that location
   - Commit updates to the repository

3. **GitHub Pages** will automatically deploy the updated site

## Testing the Deployment

### Manual Workflow Trigger

1. Go to **Actions** tab in your GitHub repository
2. Select a workflow (e.g., "Fetch Weather Data")
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow** button

### Check Workflow Status

- Monitor the workflow run in the Actions tab
- Look for any errors in the logs
- Verify that data files are being updated in the `data/` directory

### Verify Site Deployment

Visit your GitHub Pages URL:
- Clifton: `https://scholtzap.github.io/Clifton-Beach-Frisbee-Weather-Dashboard/`
- Praia: `https://scholtzap.github.io/Praia-da-Rocha-Beach-Ultimate-Weather-Dashboard/`

## Updating Configuration

### To Change Location Settings:

1. **Edit `config.yml`** in your repository
2. **Commit and push changes:**
   ```bash
   git add config.yml
   git commit -m "Update location configuration"
   git push
   ```

3. **Re-run workflows** to apply changes

### To Add a New Location:

1. **Edit `config.yml`** and add new location block:
   ```yaml
   locations:
     new_beach:
       name: "New Beach Name"
       title: "New Beach Weather"
       # ... add all required settings
   ```

2. **Create new repository** or branch

3. **Set `LOCATION` variable** to `new_beach`

4. **Add required secrets**

5. **Push and deploy**

## Data Fetching

### Automated (GitHub Actions)
Workflows run automatically on schedule:
- Weather: Every 3 hours
- Tides: Daily at 6:15 AM
- Busyness: Every 6 hours

### Manual (Docker)
```bash
# Fetch all data for a location
LOCATION=praia docker-compose -f docker-compose.dev.yml run --rm fetcher npm run fetch:all

# Fetch specific data types
LOCATION=clifton docker-compose -f docker-compose.dev.yml run --rm fetcher npm run fetch:weather
LOCATION=clifton docker-compose -f docker-compose.dev.yml run --rm fetcher npm run fetch:tides
LOCATION=clifton docker-compose -f docker-compose.dev.yml run --rm fetcher npm run fetch:busyness
```

### Manual (Local)
```bash
export LOCATION=clifton
export OWM_API_KEY=your_key
export STORMGLASS_API_KEY=your_key
export GOOGLE_API_KEY=your_key

npm run fetch:all
```

## Common Issues

### Issue: Workflows not finding config.yml
**Solution:** Ensure `config.yml` is in the root directory and committed to the repository.

### Issue: "Location not found in config.yml"
**Solution:** Verify the `LOCATION` variable matches exactly (case-sensitive) with a key in `config.yml`.

### Issue: Missing dependencies error
**Solution:** Run `npm install` to ensure all Node packages are installed. Check that `js-yaml` and `node-fetch` are in `package.json`.

### Issue: Python script fails (Docker)
**Solution:** Rebuild the fetcher container: `docker-compose -f docker-compose.dev.yml build fetcher`

### Issue: Busyness data empty
**Solution:** Verify the Google Place ID in `config.yml` supports busyness data. Not all locations have this data available from Google.

### Issue: Data not showing in container
**Solution:** Check that data exists in `data/clifton/` or `data/praia/` directories and that volume mounts are correct in `docker-compose.yml`.

## Support

For issues or questions:
1. Check the main README.md
2. Review workflow logs in the Actions tab
3. Open an issue in the repository

## Common Multi-Repo Deployment Workflows

### Updating YouTube Embed URLs

**Option 1: Static Channel URL** (for channels with single stream):
```yaml
youtube_url: "https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID&autoplay=1&mute=1"
```

**Option 2: Dynamic Stream Finder** (for channels with multiple streams):
```yaml
youtube_url: "https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID&autoplay=1&mute=1"
youtube_search:
  enabled: true
  channel_id: "CHANNEL_ID"
  title_contains: "Stream title keywords"
```

**Note**: Dynamic search requires a YouTube Data API v3 key in `scripts/build-html.js`. See [MULTI-REPO-WORKFLOW.md](MULTI-REPO-WORKFLOW.md#update-youtube-embed-urls) for setup details.

**Deploy**:
1. Edit `config.yml` in the main repository
2. Test locally: `docker-compose up -d`
3. Deploy: `./deploy-all.sh "Update YouTube embed URLs"`

### Updating Weather Coordinates

1. Edit `config.yml` coordinates for the location
2. Test locally with Docker
3. Deploy: `./deploy-all.sh "Update weather coordinates"`

### Updating Shared Assets (CSS/JS)

If you modify `style.css` or `script.js`:

```bash
# Manual method (if not using deploy-all.sh)
cd /tmp/clifton-deploy
cp /path/to/main/style.css .
cp /path/to/main/script.js .
git add style.css script.js
git commit -m "Update styles"
git push

# Repeat for Praia
cd /tmp/praia-deploy
cp /path/to/main/style.css .
cp /path/to/main/script.js .
git add style.css script.js
git commit -m "Update styles"
git push
```

### Testing Before Deployment

Always test changes locally before deploying:

```bash
# 1. Edit config.yml or other files

# 2. Test both locations with Docker
docker-compose down
docker-compose build
docker-compose up -d

# 3. Verify in browser
# - Clifton: http://localhost:8080
# - Praia: http://localhost:8081

# 4. If everything looks good, deploy
./deploy-all.sh "Description of changes"
```

## Next Steps

After successful deployment:
- [ ] Monitor first few automated runs
- [ ] Verify data quality
- [ ] Test on mobile devices
- [ ] Share with your community
- [ ] Consider adding custom features from config.yml

---

**Remember:** Each repository should have its own `LOCATION` variable set, pointing to the correct section in `config.yml`.

## Documentation

- **[README.md](./README.md)** - Main project documentation
- **[MULTI-REPO-WORKFLOW.md](./MULTI-REPO-WORKFLOW.md)** - Detailed multi-repository management guide
- **[docker-quick-start.sh](./docker-quick-start.sh)** - Automated Docker setup script
