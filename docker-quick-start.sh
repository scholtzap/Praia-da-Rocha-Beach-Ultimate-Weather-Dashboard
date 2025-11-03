#!/bin/bash

# Quick Start Script for Beach Weather Dashboard Docker Setup
# This script helps you get started with Docker deployment

set -e

echo "=========================================="
echo "Beach Weather Dashboard - Docker Quick Start"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker is installed: $(docker --version)"
echo "✅ Docker Compose is installed: $(docker-compose --version)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit the .env file with your API keys before continuing."
    echo ""
    echo "Required API keys:"
    echo "  1. OWM_API_KEY          - OpenWeatherMap (https://openweathermap.org/api)"
    echo "  2. STORMGLASS_API_KEY   - StormGlass (https://stormglass.io/)"
    echo "  3. GOOGLE_API_KEY       - Google Places API"
    echo ""
    echo "Note: Google Place IDs are configured in config.yml (not in .env)"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
else
    echo "✅ .env file already exists"
fi

# Validate .env has been updated
if grep -q "your_.*_api_key_here" .env; then
    echo ""
    echo "⚠️  WARNING: .env file still contains placeholder values!"
    echo "   The dashboards may not work correctly without valid API keys."
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting. Please update your .env file and run this script again."
        exit 1
    fi
else
    echo "✅ .env file has been configured"
fi

echo ""
echo "Choose deployment mode:"
echo "  1) Production (both Clifton and Praia)"
echo "  2) Development (single location with data fetching)"
echo "  3) Custom"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting production deployment..."
        echo "   Building Docker images (this may take a few minutes)..."
        docker-compose build

        echo ""
        echo "   Starting services..."
        docker-compose up -d

        echo ""
        echo "✅ Services started successfully!"
        echo ""
        echo "Access your dashboards at:"
        echo "  • Clifton Beach: http://localhost:8080"
        echo "  • Praia da Rocha: http://localhost:8081"
        echo ""
        echo "Useful commands:"
        echo "  • View logs:     docker-compose logs -f"
        echo "  • Stop services: docker-compose down"
        echo "  • Restart:       docker-compose restart"
        echo ""
        ;;

    2)
        echo ""
        read -p "Select location (clifton/praia) [clifton]: " location
        location=${location:-clifton}

        read -p "Select port [8080]: " port
        port=${port:-8080}

        echo ""
        echo "🚀 Starting development deployment for $location..."
        echo "   Building Docker images..."
        LOCATION=$location docker-compose -f docker-compose.dev.yml build

        echo ""
        echo "   Starting development server..."
        LOCATION=$location PORT=$port docker-compose -f docker-compose.dev.yml up -d dev

        echo ""
        echo "✅ Development server started!"
        echo ""
        echo "Access your dashboard at: http://localhost:$port"
        echo ""
        echo "Useful commands:"
        echo "  • Fetch data:    docker-compose -f docker-compose.dev.yml run --rm fetcher npm run fetch:all"
        echo "  • View logs:     docker-compose -f docker-compose.dev.yml logs -f"
        echo "  • Stop server:   docker-compose -f docker-compose.dev.yml down"
        echo ""
        ;;

    3)
        echo ""
        echo "Custom deployment options:"
        echo ""
        echo "Production:"
        echo "  docker-compose build"
        echo "  docker-compose up -d"
        echo ""
        echo "Development:"
        echo "  LOCATION=clifton docker-compose -f docker-compose.dev.yml up -d dev"
        echo ""
        echo "Data Fetching:"
        echo "  LOCATION=praia docker-compose -f docker-compose.dev.yml run --rm fetcher npm run fetch:all"
        echo ""
        echo "Or use the Makefile:"
        echo "  make up              # Start production"
        echo "  make dev LOCATION=clifton  # Start development"
        echo ""
        echo "See README.md for complete documentation."
        ;;

    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "For more information, see:"
echo "  • README.md - General documentation"
echo "  • DEPLOYMENT.md - GitHub Actions deployment guide"
echo "  • make help - Makefile commands"
echo ""
