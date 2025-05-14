#!/bin/zsh

# Start the database with Docker Compose in the background
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db