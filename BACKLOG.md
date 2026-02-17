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

### 3. Internal Admin & Owner Control Plane

**Priority:** Medium
**Description:** Build a secure, isolated Internal Admin Portal for SutraID owner, internal employees, and customer support. Provides cross-tenant visibility, platform analytics, support mode (impersonation), and system health monitoring. Enterprise-grade, SOC2-friendly, zero-trust aligned.

**This is NOT customer-facing.** Strictly for SutraID Owner, Internal Employees, and Customer Support.

---

#### Architecture Overview

| Component | Location | Details |
|-----------|----------|---------|
| Admin Frontend | `apps/admin/` | New Next.js app, port 3002, deployed to `admin.sutraid.com` |
| Admin Backend | `apps/backend/src/modules/admin/` | New module group, route prefix `/api/admin/v1` |
| Database | Shared PostgreSQL | 6 new models, separate admin tables |
| Auth | Separate JWT | `aud: 'admin'`, mandatory MFA, 1-hour sessions |
| Deployment | Vercel (admin) | Separate subdomain from customer portal |

**Separation guarantees:**
- No shared session cookies with customer dashboard
- Separate JWT audience — customer tokens rejected on admin routes
- Separate RBAC scope with `AdminRole` enum
- IP allowlisting enforced at guard level
- Admin-only middleware pipeline

---

#### Database Schema Additions (6 new models)

**`AdminUser`** — Internal employee accounts
- Fields: `id`, `email`, `firstName`, `lastName`, `role` (AdminRole), `passwordHash`, `mustChangePassword`, `mfaEnabled`, `status` (AdminStatus), `lastLoginAt`, `createdBy`
- MFA mandatory for all admin users

**`AdminSession`** — Separate session tracking
- Fields: `id`, `adminUserId`, `accessToken` (jti), `refreshToken`, `ipAddress`, `userAgent`, `revoked`, `expiresAt`, `lastActiveAt`
- 1-hour expiry (vs 15min access + 30d refresh for customers)

**`AdminAuditLog`** — Every admin action logged
- Fields: `id`, `adminUserId`, `action`, `resource`, `resourceId`, `targetOrgId`, `targetUserId`, `result`, `metadata` (JSON), `ipAddress`, `userAgent`, `createdAt`
- Append-only, tamper-proof design

**`IpAllowlist`** — Config-driven IP restrictions
- Fields: `id`, `ipAddress` (single IP or CIDR), `description`, `enabled`, `createdBy`

**`AdminMfaMethod`** — TOTP for admin users
- Fields: `id`, `adminUserId`, `type`, `totpSecret` (encrypted AES-256-GCM), `backupCodes`, `verified`, `enabled`

**`ImpersonationSession`** — Tracks support mode usage
- Fields: `id`, `adminUserId`, `targetUserId`, `targetOrgId`, `reason`, `startedAt`, `endedAt`, `active`, `ipAddress`

**New Enums:**
- `AdminRole`: `PLATFORM_SUPER_ADMIN`, `SUPPORT_AGENT`, `READ_ONLY_AUDITOR`
- `AdminStatus`: `ACTIVE`, `SUSPENDED`, `DELETED`

---

#### Admin RBAC Model

| Permission | PLATFORM_SUPER_ADMIN | SUPPORT_AGENT | READ_ONLY_AUDITOR |
|------------|---------------------|---------------|-------------------|
| `admin:dashboard:read` | Yes | Yes | Yes |
| `admin:orgs:read` | Yes | Yes | Yes |
| `admin:orgs:update` | Yes | Yes | No |
| `admin:orgs:suspend` | Yes | No | No |
| `admin:users:read` | Yes | Yes | Yes |
| `admin:users:impersonate` | Yes | Yes | No |
| `admin:users:suspend` | Yes | Yes | No |
| `admin:audit:read` | Yes | Yes | Yes |
| `admin:apps:read` | Yes | Yes | Yes |
| `admin:admin-users:manage` | Yes | No | No |
| `admin:settings:manage` | Yes | No | No |
| `admin:health:read` | Yes | Yes | Yes |

---

#### Security Architecture

**3-layer guard stack (applied to all admin routes):**
1. `IpAllowlistGuard` — reject requests from non-allowlisted IPs
2. `AdminJwtGuard` — verify JWT with `aud === 'admin'`, attach adminUser to request
3. `AdminRbacGuard` — check AdminRole against permission matrix

**Admin JWT structure:**
```json
{
  "sub": "adminUserId",
  "jti": "adminSessionId",
  "aud": "admin",
  "role": "PLATFORM_SUPER_ADMIN",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Additional security:**
- Mandatory MFA enrollment before first login
- Elevated action confirmation (suspend org, delete user) with re-auth prompt
- All admin actions logged to `AdminAuditLog`
- Impersonation requires reason field, tracked in `ImpersonationSession`

---

#### Backend Module Structure

```
apps/backend/src/modules/admin/
├── admin.module.ts
├── auth/
│   ├── admin-auth.controller.ts     # POST /api/admin/v1/auth/login, /logout, /me
│   ├── admin-auth.service.ts        # Login, MFA, session management
│   ├── guards/
│   │   ├── admin-jwt.guard.ts       # Verify admin JWT (aud: 'admin')
│   │   ├── admin-rbac.guard.ts      # Admin role-based access
│   │   └── ip-allowlist.guard.ts    # IP restriction enforcement
│   └── dto/
├── dashboard/
│   ├── admin-dashboard.controller.ts  # GET /api/admin/v1/dashboard/stats
│   └── admin-dashboard.service.ts     # Platform-wide metrics (cached 5min)
├── organizations/
│   ├── admin-orgs.controller.ts     # CRUD /api/admin/v1/organizations
│   └── admin-orgs.service.ts        # Cross-tenant org queries
├── customer-users/
│   ├── admin-customer-users.controller.ts  # CRUD /api/admin/v1/users
│   └── admin-customer-users.service.ts
├── audit/
│   ├── admin-audit.controller.ts    # GET /api/admin/v1/audit
│   └── admin-audit.service.ts       # Global audit query + admin action logging
├── impersonation/
│   ├── impersonation.controller.ts  # POST /api/admin/v1/impersonate/:userId
│   └── impersonation.service.ts     # Generate impersonation tokens
├── users/
│   ├── admin-users.controller.ts    # CRUD /api/admin/v1/admin-users
│   └── admin-users.service.ts       # Manage admin accounts
├── settings/
│   ├── admin-settings.controller.ts # IP allowlist CRUD
│   └── admin-settings.service.ts
├── health/
│   ├── admin-health.controller.ts   # GET /api/admin/v1/health/*
│   └── admin-health.service.ts      # DB, sessions, errors
└── decorators/
    └── require-admin-permission.decorator.ts
```

---

#### Frontend App Structure

```
apps/admin/
├── package.json                      # @sutraid/admin, Next.js 15, port 3002
├── next.config.js
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout (CSS variables, theme)
│   │   ├── login/page.tsx            # Admin login (email + password)
│   │   ├── verify-mfa/page.tsx       # TOTP verification
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            # Auth check, sidebar, navbar
│   │   │   ├── page.tsx              # Platform overview (metrics cards)
│   │   │   ├── organizations/
│   │   │   │   ├── page.tsx          # Searchable org table
│   │   │   │   └── [orgId]/page.tsx  # Org deep view (tabs: summary, metrics, entities)
│   │   │   ├── users/
│   │   │   │   ├── page.tsx          # Global user search
│   │   │   │   └── [userId]/page.tsx # User detail + impersonate button
│   │   │   ├── audit/
│   │   │   │   ├── page.tsx          # Customer audit logs (global)
│   │   │   │   └── admin/page.tsx    # Admin action logs
│   │   │   ├── admin-users/page.tsx  # Manage admin accounts (SUPER_ADMIN only)
│   │   │   ├── settings/
│   │   │   │   └── ip-allowlist/page.tsx
│   │   │   └── health/page.tsx       # System health (auto-refresh 30s)
│   ├── components/
│   │   ├── admin-layout/
│   │   │   ├── AdminSidebar.tsx      # Role-based nav links
│   │   │   ├── AdminNavbar.tsx       # Admin user info, theme toggle, logout
│   │   │   └── AdminBreadcrumb.tsx
│   │   ├── dashboard/
│   │   │   ├── MetricCard.tsx
│   │   │   ├── OrgTable.tsx          # Searchable, filterable, paginated
│   │   │   ├── UserTable.tsx
│   │   │   └── AuditLogTable.tsx
│   │   └── impersonation/
│   │       ├── ImpersonateButton.tsx  # Requires reason, opens customer portal
│   │       └── ImpersonationBanner.tsx
│   └── lib/
│       ├── admin-api.ts              # Fetch wrapper with admin token
│       └── auth.ts                   # Admin auth helpers
```

---

#### API Routes Summary

| Method | Route | Permission | Description |
|--------|-------|-----------|-------------|
| POST | `/api/admin/v1/auth/login` | Public | Admin login |
| POST | `/api/admin/v1/auth/verify-mfa` | Public | MFA verification |
| POST | `/api/admin/v1/auth/logout` | Authenticated | Revoke admin session |
| GET | `/api/admin/v1/auth/me` | Authenticated | Get current admin user |
| GET | `/api/admin/v1/dashboard/stats` | `dashboard:read` | Platform metrics |
| GET | `/api/admin/v1/dashboard/activity` | `dashboard:read` | Recent activity |
| GET | `/api/admin/v1/organizations` | `orgs:read` | List all orgs (paginated) |
| GET | `/api/admin/v1/organizations/:orgId` | `orgs:read` | Org detail |
| PUT | `/api/admin/v1/organizations/:orgId` | `orgs:update` | Update org |
| POST | `/api/admin/v1/organizations/:orgId/suspend` | `orgs:suspend` | Suspend org |
| GET | `/api/admin/v1/organizations/:orgId/stats` | `orgs:read` | Org stats |
| GET | `/api/admin/v1/users` | `users:read` | List all customer users |
| GET | `/api/admin/v1/users/:userId` | `users:read` | User detail |
| PUT | `/api/admin/v1/users/:userId` | `users:suspend` | Update user |
| POST | `/api/admin/v1/users/:userId/suspend` | `users:suspend` | Suspend user |
| POST | `/api/admin/v1/impersonate/:userId` | `users:impersonate` | Start impersonation |
| POST | `/api/admin/v1/impersonate/:sessionId/end` | `users:impersonate` | End impersonation |
| GET | `/api/admin/v1/audit` | `audit:read` | Global customer audit logs |
| GET | `/api/admin/v1/audit/admin` | `audit:read` | Admin action logs |
| GET | `/api/admin/v1/audit/stats` | `audit:read` | Audit stats |
| POST | `/api/admin/v1/admin-users` | `admin-users:manage` | Create admin user |
| GET | `/api/admin/v1/admin-users` | `admin-users:manage` | List admin users |
| PUT | `/api/admin/v1/admin-users/:id/role` | `admin-users:manage` | Update admin role |
| DELETE | `/api/admin/v1/admin-users/:id` | `admin-users:manage` | Delete admin user |
| GET | `/api/admin/v1/settings/ip-allowlist` | `settings:manage` | List allowed IPs |
| POST | `/api/admin/v1/settings/ip-allowlist` | `settings:manage` | Add IP |
| DELETE | `/api/admin/v1/settings/ip-allowlist/:id` | `settings:manage` | Remove IP |
| GET | `/api/admin/v1/health/database` | `health:read` | DB health |
| GET | `/api/admin/v1/health/sessions` | `health:read` | Session stats |
| GET | `/api/admin/v1/health/errors` | `health:read` | Error stats |

---

#### Epics & Stories Breakdown

**Epic 1: Database Schema & Admin User Management**

| Story | Description | Tasks |
|-------|-------------|-------|
| 1.1 | Create AdminUser, AdminSession, AdminMfaMethod models | Add to Prisma schema, run migration, generate client |
| 1.2 | Create AdminAuditLog, IpAllowlist, ImpersonationSession models | Add to Prisma schema, run migration, create seed script for first admin user |

**Epic 2: Backend Admin Auth & Core**

| Story | Description | Tasks |
|-------|-------------|-------|
| 2.1 | Admin authentication module | Create admin-auth service (login, MFA, session), controller, DTOs |
| 2.2 | Admin guards & RBAC | Create AdminJwtGuard, AdminRbacGuard, IpAllowlistGuard, permission matrix, decorator |
| 2.3 | Admin audit service | Create admin-audit service (log, query, stats), controller, logging interceptor |

**Epic 3: Backend Admin Features (Org & User Management)**

| Story | Description | Tasks |
|-------|-------------|-------|
| 3.1 | Admin Organizations API | Cross-tenant org list/detail/update/suspend, search, pagination |
| 3.2 | Admin Customer Users API | Cross-tenant user list/detail/suspend/delete, search, filtering |
| 3.3 | Admin Dashboard Stats API | Platform metrics, recent activity, top orgs, 5-min cache |

**Epic 4: Impersonation / Support Mode**

| Story | Description | Tasks |
|-------|-------------|-------|
| 4.1 | Impersonation backend | Session tracking, impersonation token generation, modify customer JwtAuthGuard to detect impersonation |
| 4.2 | Impersonation frontend | ImpersonateButton, reason prompt, active sessions table, customer portal banner |

**Epic 5: Admin Frontend Setup**

| Story | Description | Tasks |
|-------|-------------|-------|
| 5.1 | Create `apps/admin` scaffold | New Next.js app, turbo config, port 3002, CSS variables |
| 5.2 | Admin login page | Login form, MFA verify page, admin-api.ts fetch wrapper |
| 5.3 | Admin dashboard layout | Auth check, AdminSidebar (role-based nav), AdminNavbar |

**Epic 6: Admin Frontend Dashboard Pages**

| Story | Description | Tasks |
|-------|-------------|-------|
| 6.1 | Platform overview dashboard | MetricCard component, stats display, recent activity |
| 6.2 | Organizations list & detail | OrgTable (search, filter, paginate), org deep view with tabs |
| 6.3 | Users list & detail | UserTable (search, org filter, paginate), user detail, impersonate button |
| 6.4 | Audit logs pages | Customer audit + admin audit, filters, JSON detail view, CSV export |

**Epic 7: Admin User Management & Settings**

| Story | Description | Tasks |
|-------|-------------|-------|
| 7.1 | Admin users management backend | CRUD admin users, role changes, temp password generation |
| 7.2 | Admin users management frontend | Admin users table, create modal, role change dropdown |
| 7.3 | IP allowlist management | Backend CRUD + frontend table, add/remove IPs |

**Epic 8: System Health & Monitoring**

| Story | Description | Tasks |
|-------|-------------|-------|
| 8.1 | System health backend | DB stats, session stats, error stats endpoints |
| 8.2 | System health frontend | Health dashboard, auto-refresh 30s, manual refresh |

**Epic 9: Testing & Documentation**

| Story | Description | Tasks |
|-------|-------------|-------|
| 9.1 | Backend testing | Unit tests for all admin services, integration tests for controllers, >80% coverage |
| 9.2 | Documentation | Admin portal guide, API reference, admin setup docs |
| 9.3 | Deployment configuration | `apps/admin/vercel.json`, env vars documentation, deployment guide |

---

#### Epic Dependencies

```
Epic 1 (Schema) → Epic 2 (Auth) → Epic 3 (APIs) → Epic 6 (Frontend Pages)
                                 → Epic 4 (Impersonation, parallel with 5/6)
                   Epic 5 (Frontend Setup) → Epic 6 (Frontend Pages)
Epic 7 (Admin Users, parallel with 6) → Epic 8 (Health) → Epic 9 (Testing)
```

---

#### Key Files to Modify/Create

**Existing files to modify:**
- `apps/backend/prisma/schema.prisma` — add 6 new models + 2 enums
- `apps/backend/src/app.module.ts` — import AdminModule
- `turbo.json` — add admin app to pipeline
- `pnpm-workspace.yaml` — already covers `apps/*`

**New directories to create:**
- `apps/admin/` — entire new Next.js app
- `apps/backend/src/modules/admin/` — entire new backend module group

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
