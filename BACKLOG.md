# SutraID Backlog

## Pending

### 1. Cloud Deployment (Vercel + Railway)
**Priority:** High
**Description:** Deploy frontend to Vercel and backend to Railway.

**Scope:**
- **Frontend (web)** → Deploy to **Vercel**
  - Config file ready: `apps/web/vercel.json`
  - Set `NEXT_PUBLIC_API_URL` to Railway backend URL
- **Backend (backend)** → Deploy to **Railway**
  - Config files ready: `apps/backend/railway.json`, `apps/backend/nixpacks.toml`
  - Set env vars: `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `RESEND_API_KEY`, `FRONTEND_URL`, `MAGIC_LINK_BASE_URL`

**Steps:**
1. Import GitLab repo on vercel.com (root dir: `apps/web`)
2. Import GitLab repo on railway.app (root dir: `apps/backend`)
3. Cross-update URLs between services after deployment

---

### 2. GitLab CI/CD Pipeline for Auto-Deployment
**Priority:** Medium
**Description:** Set up `.gitlab-ci.yml` to automatically deploy on every push to `main`.

**Pipeline Stages:**
1. `install` - Install dependencies (`pnpm install`)
2. `lint` - Run linting
3. `build` - Build both apps
4. `test` - Run tests
5. `deploy` - Deploy web to Vercel, backend to Railway

**Requirements:**
- Vercel account + project linked to the repo
- Railway account + project set up for the backend
- GitLab CI/CD variables: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RAILWAY_TOKEN`
- Only deploy from `main` branch

---

## Completed

_(none yet)_
