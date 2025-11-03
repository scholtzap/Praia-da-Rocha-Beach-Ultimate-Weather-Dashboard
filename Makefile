# Makefile for Beach Weather Dashboard Docker operations

.PHONY: help build up down logs restart clean dev fetch-all fetch-weather fetch-tides fetch-busyness

# Default target
help:
	@echo "Beach Weather Dashboard - Docker Commands"
	@echo "=========================================="
	@echo ""
	@echo "Production Commands:"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start both Clifton and Praia dashboards"
	@echo "  make down           - Stop all services"
	@echo "  make logs           - View logs from all services"
	@echo "  make restart        - Restart all services"
	@echo "  make clean          - Remove all containers and images"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev LOCATION=clifton - Start dev server for Clifton"
	@echo "  make dev LOCATION=praia   - Start dev server for Praia"
	@echo "  make fetch-all            - Fetch all data (weather, tides, busyness)"
	@echo "  make fetch-weather        - Fetch weather data only"
	@echo "  make fetch-tides          - Fetch tide data only"
	@echo "  make fetch-busyness       - Fetch busyness data only"
	@echo "  make rebuild              - Rebuild HTML for current location"
	@echo ""
	@echo "Individual Services:"
	@echo "  make clifton-up     - Start Clifton dashboard only"
	@echo "  make praia-up       - Start Praia dashboard only"
	@echo "  make clifton-logs   - View Clifton logs"
	@echo "  make praia-logs     - View Praia logs"
	@echo ""
	@echo "Access URLs:"
	@echo "  Clifton: http://localhost:8080"
	@echo "  Praia:   http://localhost:8081"
	@echo ""

# Production commands
build:
	@echo "Building Docker images..."
	docker-compose build

up:
	@echo "Starting all services..."
	docker-compose up -d
	@echo ""
	@echo "Services started!"
	@echo "Clifton: http://localhost:8080"
	@echo "Praia:   http://localhost:8081"

down:
	@echo "Stopping all services..."
	docker-compose down

logs:
	docker-compose logs -f

restart:
	@echo "Restarting all services..."
	docker-compose restart

clean:
	@echo "Cleaning up Docker resources..."
	docker-compose down -v
	docker rmi beach-ultimate-weather-dashboard-clifton beach-ultimate-weather-dashboard-praia 2>/dev/null || true

# Individual service commands
clifton-up:
	@echo "Starting Clifton dashboard..."
	docker-compose up -d clifton
	@echo "Clifton: http://localhost:8080"

praia-up:
	@echo "Starting Praia dashboard..."
	docker-compose up -d praia
	@echo "Praia: http://localhost:8081"

clifton-logs:
	docker-compose logs -f clifton

praia-logs:
	docker-compose logs -f praia

# Development commands
dev:
	@if [ -z "$(LOCATION)" ]; then \
		echo "Error: LOCATION not set. Use: make dev LOCATION=clifton or LOCATION=praia"; \
		exit 1; \
	fi
	@echo "Starting development server for $(LOCATION)..."
	LOCATION=$(LOCATION) docker-compose -f docker-compose.dev.yml up -d dev
	@echo ""
	@echo "Dev server started for $(LOCATION)"
	@echo "URL: http://localhost:${PORT:-8080}"

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

# Data fetching commands
fetch-all:
	@echo "Fetching all data for $(LOCATION)..."
	docker-compose -f docker-compose.dev.yml run --rm fetcher npm run fetch:all

fetch-weather:
	@echo "Fetching weather data..."
	docker-compose -f docker-compose.dev.yml run --rm fetcher npm run fetch:weather

fetch-tides:
	@echo "Fetching tide data..."
	docker-compose -f docker-compose.dev.yml run --rm fetcher npm run fetch:tides

fetch-busyness:
	@echo "Fetching busyness data..."
	docker-compose -f docker-compose.dev.yml run --rm fetcher npm run fetch:busyness

rebuild:
	@echo "Rebuilding HTML..."
	docker-compose -f docker-compose.dev.yml run --rm fetcher npm run build
	docker-compose -f docker-compose.dev.yml restart dev 2>/dev/null || true

# Health check
health:
	@echo "Checking service health..."
	@curl -s http://localhost:8080/health && echo " - Clifton: OK" || echo " - Clifton: DOWN"
	@curl -s http://localhost:8081/health && echo " - Praia: OK" || echo " - Praia: DOWN"

# Setup
setup:
	@if [ ! -f .env ]; then \
		echo "Creating .env file from .env.example..."; \
		cp .env.example .env; \
		echo "Please edit .env file with your API keys"; \
	else \
		echo ".env file already exists"; \
	fi

# Full rebuild
rebuild-all:
	@echo "Performing full rebuild..."
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "Full rebuild complete!"
