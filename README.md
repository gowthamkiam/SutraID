# SutraID

> **The only CIAM platform built for both humans AND AI agents**

**AI-Native Authentication** | **$0/month FREE tier** | **Enterprise-ready Security**

---

## What is SutraID?

SutraID is a next-generation Customer Identity and Access Management (CIAM) platform designed for the AI era. While traditional auth platforms (Auth0, Clerk, Okta) only support human users, **SutraID provides first-class support for both human users AND AI agents**.

### Key Features

**For Humans:**
- Passwordless authentication (magic links, email OTP)
- Social login (Google, GitHub, Microsoft)
- Multi-factor authentication (TOTP, SMS)
- No-code admin dashboard

**For AI Agents (Unique!):**
- Non-human identity support (MCP servers, bots, service accounts)
- Token delegation chains (agent -> agent -> service)
- OAuth 2.1 with PKCE, DCR, and PRM
- Runtime auditing of agent behavior
- MCP (Model Context Protocol) server discovery

### Tech Stack

- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL
- **Frontend**: Next.js 15 + React + TypeScript + Tailwind CSS
- **Infrastructure**: 100% FREE tier (Neon.tech, Upstash, Resend, Netlify, Railway)

---

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- (Optional) Docker Desktop

### Installation

```bash
# Clone repository
git clone https://gitlab.com/sutraid/sutraid_app.git
cd sutraid_app

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

The backend will run on `http://localhost:3000` and the frontend on `http://localhost:3001`.

---

## Project Structure

```
sutraid/
├── apps/
│   ├── backend/          # NestJS API server
│   └── web/              # Next.js admin dashboard
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── scripts/              # Utility scripts
└── docs/                 # Documentation
```

---

## Development

- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps for production
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Lint all code
- `pnpm format` - Format code with Prettier

---

## Cost: $0/month

This demo runs entirely on FREE tiers:
- **Database**: Neon.tech (0.5GB)
- **Cache**: Upstash Redis (10K commands/day)
- **Email**: Resend (3K emails/month)
- **Hosting**: Netlify (frontend) + Railway (backend)

**Capacity**: 100-500 concurrent users, 10K auth requests/day

---

## License

MIT

---

Built with love for the AI-first era
