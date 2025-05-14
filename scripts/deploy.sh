#!/bin/zsh

if [[ -z "$BIRDBOT_PATH" ]]; then
  echo "Error: BIRDBOT_PATH is not set"
  exit 1
fi

# Navigate to project root
cd "$BIRDBOT_PATH" || exit 1

# Pull latest code (optional, if you want to pull again at deploy time)
# git pull origin main

# Rebuild and restart only website, api, bot containers
docker-compose build website api bot

# Use docker-compose to recreate containers with zero downtime
# Assuming you use docker-compose v2+ with 'up --detach --no-deps --build'
docker-compose up -d --build --no-deps website api bot

# Remove the cron job after successful deploy to avoid daily runs
crontab -l | grep -v 'deploy.sh' | crontab -

echo "Deploy completed at $(date)"
