# Replacement for Puppeteer-based scraper using populartimes library in Python

# Instructions:
# 1. Install the populartimes library from https://github.com/m-wrzr/populartimes
#    git clone https://github.com/m-wrzr/populartimes.git
#    cd populartimes
#    pip install -r requirements.txt
# 2. Store your API key and place ID as GitHub secrets:
#    - GOOGLE_API_KEY
#    - GOOGLE_PLACE_ID

import json
import populartimes
import os

# Load credentials from environment variables (GitHub Actions secrets)
API_KEY = os.getenv("GOOGLE_API_KEY")
PLACE_ID = os.getenv("GOOGLE_PLACE_ID")

if not API_KEY:
    raise EnvironmentError("Missing GOOGLE_API_KEY environment variable.")
if not PLACE_ID:
    raise EnvironmentError("Missing GOOGLE_PLACE_ID environment variable.")

# Fetch popular times data from populartimes
try:
    print("🚀 Fetching Popular Times data using populartimes...")
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
