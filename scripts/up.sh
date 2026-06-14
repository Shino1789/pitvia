#!/bin/bash

# ==================================================
# Docker開発環境 起動スクリプト
# ==================================================

docker compose \
-f docker-compose.dev.yml \
--env-file .env.dev up
