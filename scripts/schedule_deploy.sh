#!/bin/zsh

if [[ -z "$BIRDBOT_PATH" ]]; then
  echo "Error: BIRDBOT_PATH is not set"
  exit 1
fi

# Remove any existing deploy.sh cron jobs to avoid duplicates
crontab -l | grep -v 'deploy.sh' | crontab -

# Calculate next day date in cron format (5 AM)
# Cron format: minute hour day month weekday
# We want 5 AM next day, so day = tomorrow's day of month

next_day=$(date -d "tomorrow" +%d)
month=$(date -d "tomorrow" +%m)
hour=5
minute=0

# Add new cron job for deploy.sh at 5 AM next day
(crontab -l 2>/dev/null; echo "$minute $hour $next_day $month * /bin/zsh $BIRDBOT_PATH/scripts/deploy.sh >> $BIRDBOT_PATH/logs/deploy.log 2>&1") | crontab -

echo "Deploy scheduled at $next_day/$month at $hour:$minute"
