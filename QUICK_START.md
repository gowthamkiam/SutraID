# 🚀 Quick Start Guide - SutraID Phase 2

## Commands to Run the Project

### Terminal 1: Backend (Port 3000)
```bash
cd apps/backend
pnpm install            # First time only
pnpm prisma generate    # First time only
pnpm prisma migrate dev # First time only
pnpm run dev            # Start backend
```

### Terminal 2: Frontend (Port 3001)
```bash
cd apps/web
pnpm install            # First time only
pnpm run dev            # Start frontend
```

## Access URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api/v1
- **Login Page**: http://localhost:3001/login
- **Dashboard**: http://localhost:3001/dashboard
- **SSO Providers**: http://localhost:3001/dashboard/sso/providers

## Environment Setup (First Time)

### 1. Backend Environment
Create `apps/backend/.env`:
```bash
DATABASE_URL="postgresql://user:pass@host/db"
ENCRYPTION_KEY="generate-with-openssl-rand-hex-32"
JWT_PRIVATE_KEY="generate-with-openssl-genrsa"
JWT_PUBLIC_KEY="extract-from-private-key"
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"
```

Generate encryption key:
```bash
openssl rand -hex 32
```

### 2. Frontend Environment
Create `apps/web/.env.local`:
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"
```

## What's Available Now

### ✅ Backend
- SSO provider management API (CRUD)
- SAML 2.0 authentication endpoints
- OIDC authentication with PKCE
- Encrypted credential storage
- Auto-provisioning with domain restrictions

### ✅ Frontend
- SSO provider list page
- Create SSO provider wizard (SAML + OIDC)
- Dashboard with SSO management link
- Type-safe API client

### ⏳ Pending
- Login page SSO detection
- SSO provider edit page

## Quick Test Flow

1. Start backend and frontend (see commands above)
2. Login at http://localhost:3001/login
3. Go to http://localhost:3001/dashboard
4. Click "Manage SSO Providers"
5. Click "+ Add SSO Provider"
6. Choose SAML or OIDC
7. Fill in provider details
8. Save and test!

## Production Deployment

### Backend (Railway/Render)
```bash
# Railway
railway up

# Render
# Connect GitHub repo, auto-deploys
```

### Frontend (Netlify)
```bash
# Netlify
netlify deploy --prod

# Or connect GitHub/GitLab repo on netlify.com for auto-deploy
```

---

For detailed documentation, see [PHASE2_COMPLETE.md](PHASE2_COMPLETE.md)
