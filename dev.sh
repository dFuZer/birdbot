#!/bin/zsh

docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build db website api