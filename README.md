# Project Aegis Development Guide

## Overview

Project Aegis is a hybrid encrypted messaging platform described in `Docs.md`. This repository contains:

- `server.js` – Express/Socket.io backend (zero-knowledge message relay with admin access).
- `client/` – Vite + React user SPA handling on-device cryptography.
- `admin/` – Vite + React moderation portal for the master administrator.
- `shared/crypto/` – Shared cryptographic helpers used by the SPAs.

## Prerequisites

- Node.js 20.x (matches container base image)
- npm 10+
- PostgreSQL 15+
- Optional: Docker 24+ and Docker Compose v2

## Environment Variables

Copy `env.example` to `.env` (backend) and add values:

```bash
cp env.example .env
```

Key variables (see `env.example` for defaults):

- `DATABASE_URL` – Postgres connection string
- `DB_SSL` – `"true"` for SSL connections, otherwise `"false"`
- `JWT_SECRET` / `JWT_EXPIRES_IN` – User auth token config
- `ADMIN_API_TOKEN` – Shared secret for admin API access
- `ADMIN_PUBLIC_KEY` – Base64 public key generated via `generateAdminKeys.js`

## Local Development (Node)

1. Install dependencies:

   ```bash
   npm install
   cd client && npm install
   cd ../admin && npm install
   ```

2. Create the database schema:

   ```bash
   npm run db:init
   npm run db:seed:admin
   ```

3. Start the backend:

   ```bash
   npm run dev
   ```

4. In separate terminals, start the SPAs:

   ```bash
   cd client && npm run dev
   cd admin && npm run dev
   ```

## Docker Compose

Run the entire stack (backend + Postgres) with:

```bash
docker compose up --build
```

The compose file:

- Builds the backend image (`Dockerfile`)
- Waits for Postgres (`npm run db:wait`)
- Applies the schema (`npm run db:init`)
- Starts the API on port `3000`

Configure secrets via environment variables in `docker-compose.yml` or an override file.

Stop and clean up:

```bash
docker compose down
```

Remove persisted data:

```bash
docker compose down -v
```

## Scripts

Key npm scripts (root `package.json`):

- `npm run db:wait` – Polls the database before migrations
- `npm run db:init` – Applies `schema.sql`
- `npm run db:seed:admin` – Inserts/updates the admin public key
- `npm test` – Backend tests (placeholder health check)

## Testing & Linting

Backend:

```bash
npm test
```

Client/Admin (Vitest scaffolding):

```bash
cd client && npm run test
cd admin && npm run test
```

Linting/formatting configuration is tracked in `Plan.md` (OP-009) and still pending.

## Reference

- Full PRD/TRD: `Docs.md`
- Execution roadmap & status: `Plan.md`
- Admin key generation: `generateAdminKeys.js`

