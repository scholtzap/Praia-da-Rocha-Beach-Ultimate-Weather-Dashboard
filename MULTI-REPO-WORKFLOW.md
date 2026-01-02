# Multi-Repository Deployment Workflow

This guide explains how to manage the Beach Ultimate Weather Dashboard with multiple location deployments.

## Repository Structure

```
beach-ultimate-weather-dashboard/     # Source repository (local)
├── config.yml                        # Shared configuration for all locations
├── deploy-all.sh                     # 🚀 One-command deploy script
├── scripts/build-html.js             # Builds location-specific HTML
├── style.css, script.js              # Shared assets
└── ...

/tmp/clifton-deploy/                  # Clifton deployment repository
└── Git remote: scholtzap/Clifton-Beach-Frisbee-Weather-Dashboard

/tmp/praia-deploy/                    # Praia deployment repository
└── Git remote: scholtzap/Praia-da-Rocha-Beach-Ultimate-Weather-Dashboard
```

## Configuration File

All location settings are centralized in `config.yml`:

```yaml
locations:
  clifton:
    name: "Clifton Beach Frisbee"
    youtube_url: "https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1"
    coordinates: {...}

  praia:
    name: "Praia da Rocha Beach Ultimate"
    youtube_url: "https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1"
    coordinates: {...}
```

## Workflow: Making Changes

### 🚀 SUPER SIMPLE METHOD (Recommended)

**One command to deploy to all locations:**

```bash
cd /mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard
./deploy-all.sh "Your commit message here"
```

That's it! This script will:
1. Copy your updated `config.yml` to both deployment repos
2. Build location-specific HTML for each
3. Commit and push to both GitHub repositories
4. Auto-deploy via GitHub Pages

**Example:**
```bash
./deploy-all.sh "Fix YouTube embed URLs"
```

---

### Manual Method (For Advanced Use)

If you need more control or want to deploy to only one location, use the manual method below.

### 1. Edit Configuration

Edit the main config file:
```bash
# Working directory: /mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard
nano config.yml
```

### 2. Test Locally with Docker

Build and test both locations:
```bash
# Build both containers
docker-compose build

# Start both containers
docker-compose up -d

# View in browser:
# - Clifton: http://localhost:8080
# - Praia: http://localhost:8081

# Check logs
docker-compose logs

# Stop containers
docker-compose down
```

### 3. Deploy to Production Repositories

#### Option A: Deploy Both Locations

```bash
# Copy config and build Clifton
cd /tmp/clifton-deploy
cp /mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard/config.yml .
LOCATION=clifton node scripts/build-html.js
git add config.yml index.html
git commit -m "Your commit message"
git push

# Copy config and build Praia
cd /tmp/praia-deploy
cp /mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard/config.yml .
LOCATION=praia node scripts/build-html.js
git add config.yml index.html
git commit -m "Your commit message"
git push
```

#### Option B: Deploy Single Location

For Clifton only:
```bash
cd /tmp/clifton-deploy
cp /mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard/config.yml .
LOCATION=clifton node scripts/build-html.js
git add config.yml index.html
git commit -m "Your commit message"
git push
```

For Praia only:
```bash
cd /tmp/praia-deploy
cp /mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard/config.yml .
LOCATION=praia node scripts/build-html.js
git add config.yml index.html
git commit -m "Your commit message"
git push
```

## Common Tasks

### Update YouTube Embed URLs

#### Option 1: Static Channel URL (Simple)
For channels with a single live stream:
1. Edit `config.yml` in the main directory
2. Use the channel-based format:
   ```yaml
   youtube_url: "https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID&autoplay=1&mute=1"
   ```
3. Test with Docker
4. Deploy to production repos

#### Option 2: Dynamic Stream Finder (Advanced)
For channels with multiple live streams, use API-based search to find the correct stream by title:

1. Edit `config.yml`:
   ```yaml
   youtube_url: "https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID&autoplay=1&mute=1"
   youtube_search:
     enabled: true
     channel_id: "CHANNEL_ID"
     title_contains: "Stream title keywords"
   ```

2. **Required**: YouTube Data API v3 key is hardcoded in `scripts/build-html.js`
   - Get key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable "YouTube Data API v3"
   - **Restrict the key** to your domain:
     - HTTP referrers: `https://yourusername.github.io/*`
     - API restrictions: YouTube Data API v3 only

3. Test with Docker
4. Deploy to production repos

**How it works**: When the page loads, JavaScript calls the YouTube API to search for live streams on the channel, filters by title, and updates the iframe with the correct video ID.

### Add a New Location

1. Add new location to `config.yml`:
   ```yaml
   locations:
     new_location:
       name: "New Location Name"
       youtube_url: "..."
       coordinates: {...}
   ```
2. Create new deployment repository on GitHub
3. Clone to `/tmp/new-location-deploy`
4. Build and deploy using `LOCATION=new_location`

### Update Shared Assets (CSS, JS)

When changing `style.css` or `script.js`:
```bash
# 1. Make changes in main directory
# 2. Copy to deployment repos
cd /tmp/clifton-deploy
cp /mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard/style.css .
cp /mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard/script.js .
git add style.css script.js
git commit -m "Update shared assets"
git push

# Repeat for Praia
cd /tmp/praia-deploy
cp /mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard/style.css .
cp /mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard/script.js .
git add style.css script.js
git commit -m "Update shared assets"
git push
```

## Build Script Details

The `scripts/build-html.js` script:
- Reads `config.yml`
- Uses `LOCATION` environment variable to select which location to build
- Generates location-specific `index.html` with:
  - Location-specific title and name
  - Location-specific YouTube embed
  - Location-specific coordinates for weather/maps
  - Location-specific share URLs and WhatsApp forms

## Environment Variables

- `LOCATION=clifton` - Build for Clifton Beach
- `LOCATION=praia` - Build for Praia da Rocha

## GitHub Pages Deployment

Both repositories auto-deploy via GitHub Pages:
- Clifton: https://scholtzap.github.io/Clifton-Beach-Frisbee-Weather-Dashboard/
- Praia: https://scholtzap.github.io/Praia-da-Rocha-Beach-Ultimate-Weather-Dashboard/

Changes pushed to `main` branch are automatically deployed within a few minutes.

## Troubleshooting

### YouTube Embeds Not Working

**For static channel URLs:**
- Verify channel ID is correct
- Use format: `https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID&autoplay=1&mute=1`
- Check if channel has at least one active live stream
- Ensure embedding is enabled on the YouTube channel

**For dynamic stream finder:**
- Open browser DevTools (F12) → Console tab
- Look for error messages from `findYouTubeLiveStream()` function
- Common issues:
  - `"No live streams found"`: Channel has no active streams
  - `"No stream found matching title"`: Adjust `title_contains` in `config.yml` to match actual stream title
  - `"YouTube API error"`: Check API key restrictions in Google Cloud Console
  - API key not working: Verify domain restrictions include your GitHub Pages URL
- Verify YouTube API key in `scripts/build-html.js` is correct
- Check API quota hasn't been exceeded in Google Cloud Console

### Build Script Fails

```bash
# Check Node.js is installed
node --version

# Install dependencies if needed
cd /tmp/clifton-deploy
npm install
```

### Docker Containers Won't Start

```bash
# View detailed logs
docker-compose logs clifton
docker-compose logs praia

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Git Push Authentication Issues

If using HTTPS remotes and push fails:
```bash
# Configure Windows credential manager (WSL)
git config credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"

# Or push manually from Windows terminal
cd /path/to/repo
git push
```

## Quick Reference

| Task | Command |
|------|---------|
| **Deploy to all repos** | `./deploy-all.sh "commit message"` |
| Build Clifton HTML | `LOCATION=clifton node scripts/build-html.js` |
| Build Praia HTML | `LOCATION=praia node scripts/build-html.js` |
| Test locally | `docker-compose up -d` |
| Stop containers | `docker-compose down` |
| View logs | `docker-compose logs` |
| Check container status | `docker-compose ps` |

## Directory Paths

- Main source: `/mnt/c/Users/apsch/OneDrive/Documents/github/beach-ultimate-weather-dashboard`
- Clifton deploy: `/tmp/clifton-deploy`
- Praia deploy: `/tmp/praia-deploy`
