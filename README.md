# SutraID

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Netlify Status](https://api.netlify.com/api/v1/badges/be04b8f9-2a7f-4d0a-8b12-c40ec8304b55/deploy-status)](https://app.netlify.com/projects/sutraid/deploys)
[![CISA Secure-by-Design](https://img.shields.io/badge/CISA-Secure--by--Design-blue)](https://www.cisa.gov/securebydesign)
[![Security Policy](https://img.shields.io/badge/Security-See%20SECURITY.md-brightgreen)](SECURITY.md)
[![SBOM](https://img.shields.io/badge/SBOM-CycloneDX-success)](scripts/generate-sbom.sh)

<a href="https://www.netlify.com">
  <img src="https://www.netlify.com/assets/badges/netlify-badge-color-accent.svg" alt="Deploys by Netlify" />
</a>

## Overview

**SutraID** is an **AI-native Customer Identity and Access Management (CIAM) platform** you can self-host.  
It is designed to authenticate and authorize both **human users** and **AI agents** with modern protocols and strong security defaults.

- **Problem it solves**: Unifies identity for:
  - Human users (workforce, customers)
  - AI agents, bots, and service accounts
  - Modern applications using OAuth 2.1, OIDC, SAML, and API tokens
- **Who it’s for**: Teams building SaaS products, internal tools, and AI-powered systems that need robust, extensible authentication and authorization.

### Architecture Overview

- **Backend (`apps/backend`)**
  - NestJS + TypeScript
  - Prisma ORM + PostgreSQL
  - Auth flows: passwordless, passwords, SSO, MFA
  - Policy engine, audit logging, multi-tenancy
- **Frontend (`apps/web`)**
  - Next.js 15 + React
  - Admin / developer dashboard
  - API documentation at `/docs`
- **Shared**
  - TypeScript types in `packages/shared-types`
  - Monorepo managed by PNPM + Turbo

### Tech Stack

- **Language**: TypeScript
- **Backend**: NestJS, Prisma, PostgreSQL
- **Frontend**: Next.js 15, React
- **Tooling**: PNPM, Turbo, ESLint, Prettier
- **Optional Infra**: Railway (backend), Neon (Postgres), Netlify (frontend)

---

## Features (non-billing)

- **Authentication**
  - Passwordless login (magic links, email-based)
  - Classic username/password with secure hashing (bcrypt)
  - Session management with short-lived access tokens and refresh tokens
- **Multi-Factor Authentication (MFA)**
  - TOTP-based MFA
  - Backup codes
- **Single Sign-On (SSO)**
  - SAML 2.0 and OpenID Connect (OIDC) identity providers
  - Configurable attribute mapping
- **Multi-Tenancy**
  - Organizations with roles and membership
  - Per-tenant policies and settings
- **AI Agent Support**
  - Non-human identities for agents and services
  - Scopes and policies for agent actions
- **Policy & Audit**
  - Policy engine for authorization decisions
  - Audit logging for auth and policy events
- **Developer Experience**
  - REST API with 100+ documented endpoints
  - Documentation portal at `/docs`

> **Note:** All billing, pricing tables, and subscription dashboards have been removed from this open-source version. You are free to add your own billing layer on top if needed.

---

## Security Features

SutraID is built with [CISA Secure-by-Design](https://www.cisa.gov/securebydesign) principles:

- **Authentication Security** — Bcrypt-12 password hashing, TOTP MFA with AES-256-GCM encrypted secrets, WebAuthn/Passkey (FIDO2) support, short-lived JWT tokens (15 min), secure httpOnly cookies
- **Brute Force Protection** — Rate limiting on login, magic link, and password reset endpoints with per-IP+email tracking
- **Password Policy** — Configurable complexity requirements (uppercase, lowercase, numbers, symbols), common password blocklist
- **MFA Enforcement** — Organization-level MFA policy with configurable grace period for onboarding
- **Security Headers** — Helmet.js with CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Input Validation** — Global ValidationPipe with class-validator, Prisma ORM (SQL injection prevention)
- **Supply Chain Security** — CycloneDX SBOM generation, Dependabot automated scanning, CodeQL SAST
- **Audit Logging** — Comprehensive audit trail for auth events, policy decisions, and admin actions
- **Security Metrics** — Dashboard tracking MFA adoption, failed logins, and security event trends

See [SECURITY.md](SECURITY.md) for vulnerability reporting | [ROADMAP.md](ROADMAP.md) for planned security features | [CHANGELOG.md](CHANGELOG.md) for security fixes

---

## Architecture Diagram (ASCII)

```text
                +---------------------------+
                |        Frontend (web)    |
                |  Next.js Admin Dashboard |
                |  - Login / Onboarding    |
   Browser  --> |  - Org & User Management |
                |  - API Docs (/docs)      |
                +------------+-------------+
                             |
                             | HTTPS (REST + JSON)
                             v
                 +-----------+------------+
                 |      Backend API       |
                 |   NestJS + Prisma      |
                 |                        |
                 |  Auth Modules:         |
                 |  - Magic link, MFA     |
                 |  - SSO (SAML, OIDC)    |
                 |                        |
                 |  Domain Modules:       |
                 |  - Organizations       |
                 |  - Users & Groups      |
                 |  - Applications & SSO  |
                 |  - Policies & Audit    |
                 +-----------+------------+
                             |
                             | Prisma (SQL)
                             v
                 +-----------+------------+
                 |     PostgreSQL (DB)    |
                 |  Local or Neon-hosted  |
                 +------------------------+
```

---

## Prerequisites

- **Node.js**: 20+
- **PNPM**: 8+
- **Docker**: 24+ (for Docker-based workflow)
- **PostgreSQL**: 15+ (if not using Docker)
- **Railway CLI (optional)**: for backend deployment
- **Netlify CLI (optional)**: for frontend deployment

---

## Installation (Local Development)

### 1. Clone the Repository

```bash
git clone https://github.com/gowthamkiam/SutraID.git
cd SutraID
```

### 2. Copy Environment Templates

Root environment (used by Docker and local tools):

```bash
cp .env.example .env
```

Backend-specific env (optional; mirrors `.env.example` in `apps/backend`):

```bash
cp apps/backend/.env.example apps/backend/.env
```

Frontend-specific env:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in the placeholders with **non-production** values for local usage.  
Do **not** commit `.env` or any real secrets.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run Database Migrations

Make sure PostgreSQL is running and `DATABASE_URL` points to it (see `.env.example`).

```bash
cd apps/backend
pnpm prisma:migrate
```

This will create the schema and (optionally) seed initial data.

### 5. Start Backend

From `apps/backend`:

```bash
pnpm dev
```

The backend runs on `http://localhost:3000` by default.

### 6. Start Frontend

In a separate terminal, from `apps/web`:

```bash
pnpm dev
```

The frontend runs on `http://localhost:3001`.

---

## Running with Docker

The repository includes a **multi-stage `Dockerfile`** and **`docker-compose.yml`** that run:

- `db`: PostgreSQL 16
- `backend`: NestJS API (apps/backend)
- `web`: Next.js dashboard (apps/web)

### 1. Prepare `.env`

Ensure you have a root `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

For the default compose setup, these values are commonly used:

- `POSTGRES_DB=sutraid`
- `POSTGRES_USER=sutraid`
- `POSTGRES_PASSWORD=change_me`
- `DATABASE_URL=postgresql://sutraid:change_me@db:5432/sutraid`

### 2. Start the Stack

```bash
docker-compose up --build
```

This will:

- Build backend and frontend images from `Dockerfile`
- Start Postgres as `db`
- Run `prisma migrate deploy` on the backend container

Services:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:3001`

To stop:

```bash
docker-compose down
```

---

## Environment Variables Explained

The main template is in `.env.example`. Key variables:

| Variable              | Required | Description                                              | Example                                                          |
|-----------------------|----------|----------------------------------------------------------|------------------------------------------------------------------|
| `NODE_ENV`            | Yes      | Node environment (`development`/`production`)           | `development`                                                    |
| `DATABASE_URL`        | Yes      | Prisma connection string for PostgreSQL                 | `postgresql://sutraid:change_me@localhost:5432/sutraid`         |
| `DIRECT_DATABASE_URL` | No       | Direct connection string (e.g. Neon primary host)       | `postgresql://user:pass@neon-host.neon.tech/db?sslmode=require` |
| `JWT_SECRET`          | Yes      | Secret used to sign JWTs                                | `your_jwt_secret_here`                                          |
| `JWT_EXPIRES_IN`      | Yes      | JWT access token lifetime                               | `15m`                                                            |
| `JWT_REFRESH_EXPIRES_IN` | Yes   | Refresh token lifetime                                  | `30d`                                                            |
| `RESEND_API_KEY`      | No       | Email provider API key (for magic links)                | `re_your_api_key_here`                                          |
| `EMAIL_FROM`          | No       | From address for outbound emails                        | `noreply@example.com`                                           |
| `FRONTEND_URL`        | Yes      | Base URL for frontend (used for CORS & links)          | `http://localhost:3001`                                         |
| `ADMIN_DASHBOARD_URL` | No       | Admin dashboard URL (often same as FRONTEND_URL)        | `http://localhost:3001`                                         |
| `BACKEND_URL`         | No       | Public backend URL (used in email links, etc.)         | `http://localhost:3000`                                         |
| `MAGIC_LINK_BASE_URL` | No       | Base URL for magic link verification                    | `http://localhost:3001/auth/verify`                             |
| `ENCRYPTION_KEY`      | Yes      | 32-byte hex key for encrypting sensitive fields         | `your_32_byte_hex_key_here`                                     |
| `NEXT_PUBLIC_API_URL` | Yes      | Public API URL consumed by the frontend                 | `http://localhost:3000/api/v1`                                  |
| `POSTGRES_DB`         | No       | Local Docker Postgres database name                     | `sutraid`                                                        |
| `POSTGRES_USER`       | No       | Local Docker Postgres user                              | `sutraid`                                                        |
| `POSTGRES_PASSWORD`   | No       | Local Docker Postgres password                          | `change_me`                                                      |

> **Important:** Never commit real values for any of these. Use `.env.example` and platform-specific secret stores (Railway, Netlify, GitHub Actions, etc.).

---

## Deployment Guide

### Railway Deployment (Backend)

1. Install the Railway CLI:

   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. From the repo root, you can use the helper script:

   ```bash
   ./scripts/deploy-railway.sh
   ```

   This expects:

   - A Railway project configured for `apps/backend`
   - Environment variables such as `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY` set in Railway

3. Check the Railway dashboard for logs and the deployed backend URL.

### Neon Database Setup

Use `scripts/setup-neon.sh` as a guided checklist:

```bash
./scripts/setup-neon.sh
```

You will:

- Create a Neon project and database
- Copy the connection string(s)
- Set `DATABASE_URL` and `DIRECT_DATABASE_URL` in `.env` (or Railway)
- Run Prisma migrations against Neon:

```bash
cd apps/backend
pnpm prisma:migrate:prod
```

### Netlify Deployment (Frontend)

1. Install Netlify CLI:

   ```bash
   npm install -g netlify-cli
   netlify login
   ```

2. From the repo root, run:

   ```bash
   ./scripts/deploy-netlify.sh
   ```

3. In the Netlify dashboard, configure:

   - Build command: `pnpm build`
   - Publish directory: `.next`
   - Environment variable: `NEXT_PUBLIC_API_URL` pointing at your Railway backend, e.g. `https://your-backend.up.railway.app/api/v1`

---

## Security Notes

- **Secrets management**
  - Secrets are **never** stored in the repository.
  - Use `.env` (gitignored) for local development, and platform secret stores in production.
  - Rotate `JWT_SECRET`, `ENCRYPTION_KEY`, and database credentials if you suspect any exposure.
- **Transport security**
  - Always front your deployment with HTTPS (Cloudflare, a load balancer, or your hosting provider).
- **Hardening**
  - Set `NODE_ENV=production` in production.
  - Review CORS and allowed origins before exposing the API publicly.
  - Keep dependencies up to date and apply OS/DB patches regularly.

For more detailed vulnerability reporting steps, see `SECURITY.md`.

---

## Contributing

Contributions are welcome!

- See **`CONTRIBUTING.md`** for:
  - Local setup instructions
  - Coding standards
  - Testing and linting
  - Pull request guidelines
- All contributors are expected to follow the **`CODE_OF_CONDUCT.md`**.

---

## License

This project is licensed under the **MIT License**.  
See **`LICENSE`** for details.

