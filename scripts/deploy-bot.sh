#!/bin/zsh
set -euo pipefail

cd "${0:A:h}/.."

docker compose build bot
docker compose up -d --no-deps --build bot
