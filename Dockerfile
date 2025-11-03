# Multi-stage Dockerfile for Beach Weather Dashboard
FROM node:18-alpine AS builder

# Install Python and dependencies for fetch scripts
RUN apk add --no-cache python3 py3-pip git

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy application files
COPY . .

# Build stage - generates location-specific HTML
ARG LOCATION=clifton
ENV LOCATION=${LOCATION}

RUN node scripts/build-html.js

# Production stage - serves the static site
FROM nginx:alpine

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/index.html /usr/share/nginx/html/
COPY --from=builder /app/style.css /usr/share/nginx/html/
COPY --from=builder /app/script.js /usr/share/nginx/html/
COPY --from=builder /app/.nojekyll /usr/share/nginx/html/
COPY --from=builder /app/Robots.txt /usr/share/nginx/html/

# Create data directory with placeholder files
RUN mkdir -p /usr/share/nginx/html/data && \
    echo '{"hourly":[]}' > /usr/share/nginx/html/data/weather.json && \
    echo '{"tides":[]}' > /usr/share/nginx/html/data/tides.json && \
    echo '{"data":{}}' > /usr/share/nginx/html/data/busyness.json

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
