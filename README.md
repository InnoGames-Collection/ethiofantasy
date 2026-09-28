# EthioFantasy — Ethio Telecom Football Quiz & 7-Day Competition

Enterprise Tier-0 Telecom VAS Service integrating with Ethio Telecom Shortcode `9401` and the SP Messaging Gateway.

## Topology & Ports (`innoserver-serv001: 34.41.116.217`)
- **Player Web Client (`3400`)**: `https://ethiofantasy.innopulseplatform.com`
- **Fastify Authoritative API (`3402`)**: `https://ethiofantasy-api.innopulseplatform.com`
- **Telecom Operations & Auditor Console (`3403`)**: `https://ethiofantasy-admin.innopulseplatform.com`
- **PostgreSQL 16 (`5436`)**: `ethiofantasy` database
- **Valkey 8 (`6386`)**: Session, rate-limiting & OTP cache

## Directory Structure
```text
ethiofantasy/
├── frontend/                     # Player quiz UI (100 Levels + Daily Challenge)
├── admin/                        # 11-page telecom operator & auditor console
├── backend/                      # Fastify 5 REST API + SP Shortcode 9401 engine
├── db/migrations/                # PostgreSQL schema migrations
├── deploy/nginx/                 # Host NGINX configuration
├── scripts/                      # server-deploy.sh & remote-deploy.sh
└── docker-compose.server.yml     # Complete 5-service isolated Docker stack
```

## Quick Start (Local Development)
```bash
# 1. Start Database & Cache
docker compose up -d postgres valkey

# 2. Run Backend
cd backend && npm install && npm run dev

# 3. Run Player Frontend
cd ../frontend && npm install && npm run dev

# 4. Run Admin Console
cd ../admin && npm install && npm run dev
```
