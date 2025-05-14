#!/bin/zsh

if [[ -z "$BIRDBOT_PATH" ]]; then
  echo "Error: BIRDBOT_PATH is not set"
  exit 1
fi

cd "$BIRDBOT_PATH" || exit 1

git pull origin main

docker-compose build website api bot

docker-compose up -d --build website api bot

crontab -l | grep -v 'deploy.sh' | crontab -

echo "Deploy completed at $(date)"
