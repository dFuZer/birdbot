#!/bin/zsh

# Start the database with Docker Compose in the background
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d db &

# Wait a bit to let the database start up
sleep 5

# Run the website dev server in the background
(
  cd ./website
  npm run dev
) &

# Run the API dev server in the background
(
  cd ./api
  npm run dev
) &

# Wait for all background processes to finish
wait
