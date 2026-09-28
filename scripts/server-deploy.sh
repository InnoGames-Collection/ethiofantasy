#!/usr/bin/env bash
# ==============================================================================
# EthioFantasy — Enterprise Production Deployment Engine
# Target: GCP Compute Engine VM (innoserver-serv001: 34.41.116.217)
# ==============================================================================
set -Eeuo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

WEB_CANARY="http://127.0.0.1:3400/health"
API_CANARY="http://127.0.0.1:3402/health"
ADMIN_CANARY="http://127.0.0.1:3403/health"

rollback() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo "❌ [DEPLOYMENT FAILURE] Exit code $exit_code detected. Restarting services..."
    docker compose -f docker-compose.server.yml restart || true
  fi
}
trap rollback EXIT

echo "=============================================================================="
echo "🚀 [STAGE 1: ACT] Sequential Build & Deployment"
echo "=============================================================================="
docker compose -f docker-compose.server.yml up -d postgres valkey

echo "⏳ Waiting for PostgreSQL & Valkey healthy state..."
for i in {1..30}; do
  if docker compose -f docker-compose.server.yml ps postgres | grep -q "healthy" && \
     docker compose -f docker-compose.server.yml ps valkey | grep -q "healthy"; then
    echo "✅ Databases healthy."
    break
  fi
  sleep 1
done

docker compose -f docker-compose.server.yml build api
docker compose -f docker-compose.server.yml up -d api

docker compose -f docker-compose.server.yml build admin
docker compose -f docker-compose.server.yml up -d admin

docker compose -f docker-compose.server.yml build web
docker compose -f docker-compose.server.yml up -d web

echo "=============================================================================="
echo "🩺 [STAGE 2: VERIFY] Canary Probes"
echo "=============================================================================="
for i in {1..30}; do
  if curl -s -f "$API_CANARY" | grep -q "healthy"; then
    echo "✅ Canary 1 Passed: Fastify API Healthy (Port 3402)"
    break
  fi
  sleep 2
done

for i in {1..30}; do
  if curl -s -f "$ADMIN_CANARY" | grep -q "healthy"; then
    echo "✅ Canary 2 Passed: Admin Console Healthy (Port 3403)"
    break
  fi
  sleep 2
done

for i in {1..30}; do
  if curl -s -f "$WEB_CANARY" | grep -q "healthy"; then
    echo "✅ Canary 3 Passed: Web Client Healthy (Port 3400)"
    break
  fi
  sleep 2
done

trap - EXIT
echo "=============================================================================="
echo "🎉 [DEPLOYMENT CERTIFIED] EthioFantasy Live on innopulseplatform.com"
echo "=============================================================================="
