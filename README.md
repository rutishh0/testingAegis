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

## Backend Environment Setup

1. **Create a local `.env` file**

   Copy the provided template and fill in the values that match your environment:

```bash
cp env.example .env
```

2. **Supply the required environment variables**

   | Variable | Description |
   | --- | --- |
   | `DATABASE_URL` | PostgreSQL connection string (e.g. `postgres://user:pass@localhost:5432/aegis`) |
   | `DB_SSL` | Set to `"true"` when connecting to managed databases that require SSL |
   | `JWT_SECRET` | Random string used to sign user JWTs |
   | `JWT_EXPIRES_IN` | Optional JWT lifetime override (defaults to `24h`) |
   | `ADMIN_API_TOKEN` | Shared bearer token for admin-only REST endpoints |
   | `ADMIN_PUBLIC_KEY` | Base64 admin public key generated via `generateAdminKeys.js` |
   | `CORS_ORIGIN` | (Optional) Allowed origin for the SPA(s); defaults to `*` |

3. **Provision the database**

   - Create a local PostgreSQL database (or use Docker compose).
   - Ensure the account referenced in `DATABASE_URL` has privileges to create tables.
   - Run the initialization scripts (`npm run db:init`, `npm run db:seed:admin`) before starting the API.

4. **Admin key generation**

   Run `node generateAdminKeys.js` to produce the admin key pair. Insert the public key via `ADMIN_PUBLIC_KEY` or `npm run db:seed:admin`. Store the secret key outside of the repository and infrastructure hosts.

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

Linting / formatting:

```bash
npm run lint
npm run format
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

