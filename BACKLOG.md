# SutraID Backlog

## Pending

### 1. Cloud Deployment (Netlify + Railway)
**Priority:** High
**Description:** Deploy frontend to Netlify and backend to Railway.

**Scope:**
- **Frontend (web)** → Deploy to **Netlify**
  - Config file ready: `apps/web/netlify.toml`
  - Set `NEXT_PUBLIC_API_URL` to Railway backend URL
- **Backend (backend)** → Deploy to **Railway**
  - Config files ready: `apps/backend/railway.json`, `apps/backend/nixpacks.toml`
  - Set env vars: `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `RESEND_API_KEY`, `FRONTEND_URL`, `MAGIC_LINK_BASE_URL`

**Steps:**
1. Import GitLab/GitHub repo on netlify.com (base dir: `apps/web`)
2. Import GitHub repo on railway.app (root dir: `apps/backend`)
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
5. `deploy` - Deploy web to Netlify, backend to Railway

**Requirements:**
- Netlify account + site linked to the repo
- Railway account + project set up for the backend
- GitLab CI/CD variables: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`, `RAILWAY_TOKEN`
- Only deploy from `main` branch

---

## Bug Fixes

### BUG-1: Resend emails not delivered to mailbox
**Priority:** High
**Description:** Magic link emails sent via Resend API are not arriving in the user's mailbox. Need to investigate:
- Resend API key validity and domain verification status
- Sender domain DNS records (SPF, DKIM, DMARC)
- Resend dashboard for delivery logs and bounce/spam status
- Check if emails land in spam folder
- Verify `RESEND_API_KEY` and sender address configuration in Railway env vars

---

### BUG-2: No UI path to create/select organization after login
**Priority:** High
**Description:** The SSO providers page shows "No organization found. Please complete onboarding first." but there is no way for the user to reach the onboarding flow from the dashboard or after login. The onboarding page (`/onboard`) exists but is not linked from anywhere in the authenticated UI.

**Expected behavior:**
- After login, if the user has no organization, redirect them to `/onboard` automatically
- Or provide a visible "Create Organization" button in the dashboard
- The dashboard sidebar/nav should show current org and allow switching

**Affected pages:**
- `/dashboard` - no org selector or onboarding redirect
- `/dashboard/sso/providers` - fails with error when no org exists
- `/onboard` - exists but not discoverable from the UI

---

## Completed

_(none yet)_
