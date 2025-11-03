# Unified busyness fetcher that reads from config.yml
# Supports multiple locations via LOCATION environment variable

import json
import populartimes
import os
import yaml

# Read LOCATION environment variable (default to 'clifton')
LOCATION = os.getenv("LOCATION", "clifton")
API_KEY = os.getenv("GOOGLE_API_KEY")

# Load configuration
with open("config.yml", "r") as f:
    config = yaml.safe_load(f)

location_config = config["locations"].get(LOCATION)
if not location_config:
    raise ValueError(f'❌ Location "{LOCATION}" not found in config.yml')

# Get place ID from config or environment (environment takes precedence)
PLACE_ID = os.getenv("GOOGLE_PLACE_ID") or location_config.get("google_place_id")

if not API_KEY:
    raise EnvironmentError("Missing GOOGLE_API_KEY environment variable.")
if not PLACE_ID or PLACE_ID.startswith("YOUR_"):
    raise EnvironmentError(f"Missing or invalid GOOGLE_PLACE_ID for location '{LOCATION}'.")

print(f'🚀 Fetching busyness data for {location_config["name"]} ({LOCATION})')

# Fetch popular times data from populartimes
try:
    data = populartimes.get_id(API_KEY, PLACE_ID)

    # Create structured output for our app (matching previous Puppeteer output)
    structured = {
        "updated": json.loads(json.dumps(data))["time_spent"] if "time_spent" in data else "",
        "data": {}
    }

    for day in data.get("populartimes", []):
        structured["data"][day["name"].lower()] = day["data"]

    os.makedirs("data", exist_ok=True)
    with open("data/busyness.json", "w") as f:
        json.dump(structured, f, indent=2)
    print("✅ busyness.json written successfully.")

except Exception as e:
    print("❌ Failed to fetch popular times:", str(e))
