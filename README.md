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

## Authentication Flow

The authentication system follows the Hybrid Admin-Key model described in `Docs.md`:

### User Registration
1. **Client-side key generation**: User's browser generates a nacl.box keypair
2. **Private key encryption**: Client derives a key from the user's password (using argon2) and encrypts the private key
3. **Server storage**: Server receives and stores:
   - Username
   - Password hash (for authentication only)
   - Public key (for others to encrypt messages TO this user)
   - Encrypted private key (server cannot decrypt this)

### User Login
1. **Credential verification**: Server verifies username/password against stored hash
2. **Token issuance**: Server returns JWT token (expires after 24h by default)
3. **Key recovery**: Server returns user's encrypted private key
4. **Client-side decryption**: Client uses password to decrypt private key into memory

### Security Notes
- The server NEVER sees or stores plaintext private keys
- Private keys are encrypted client-side with the user's password
- JWT tokens expire and must be refreshed (configurable via `JWT_EXPIRES_IN`)
- Password complexity is enforced server-side (8+ chars, mixed case, number, special char)

## 🔒 Admin Security Guidelines

### Critical: Admin Secret Key Management

The `ADMIN_SECRET_KEY` is the master decryption key that enables the administrator to read all conversations. This key requires the highest level of security:

#### Storage Requirements
- **NEVER** store the `ADMIN_SECRET_KEY` on the server
- **NEVER** include it in `.env` files or configuration files
- **NEVER** commit it to source code or version control
- **NEVER** log or transmit it over unencrypted channels

#### Recommended Storage Methods
- Store the key **offline** in a secure location:
  - Password manager with strong master password
  - Encrypted USB drive kept in a physical safe
  - Hardware security module (HSM) for enterprise deployments
  - Air-gapped system dedicated to key management

#### Admin Panel Security Protocol
The admin panel is specifically designed with security in mind:
- Administrators must **manually paste** or **load** the secret key into memory for each session
- The key is **never persisted** by the browser (no cookies, localStorage, or sessionStorage)
- The key exists only in JavaScript memory and is cleared when:
  - The browser tab is closed
  - The admin logs out
  - The session expires

#### Consequences of Key Compromise
**WARNING**: Any compromise of the `ADMIN_SECRET_KEY` will result in:
- Complete loss of message confidentiality for ALL historical messages
- Ability to decrypt ALL future messages
- Irreversible breach of the entire communication system
- Potential legal and compliance violations

#### Best Practices
1. **Key Rotation**: Consider implementing a key rotation strategy for long-term deployments
2. **Access Logging**: Maintain audit logs of when the admin key is used
3. **Multi-factor Authentication**: Always use MFA for admin panel access
4. **Session Management**: Keep admin sessions short with automatic timeouts
5. **Physical Security**: Ensure the system where the key is entered is physically secure
6. **Training**: Ensure all administrators understand these security requirements

## Reference

- Full PRD/TRD: `Docs.md`
- Execution roadmap & status: `Plan.md`
- Admin key generation: `generateAdminKeys.js`

