# Phase 2: SSO Service Provider - Implementation Complete ✅

## What Has Been Built

### Backend Infrastructure (NestJS + PostgreSQL)

#### 1. Database Schema
**Location**: `apps/backend/prisma/schema.prisma`

Added two new models:
- **SsoProvider**: Stores SSO provider configurations (SAML and OIDC)
- **SsoIdentity**: Links users to external SSO identities

**Key Features**:
- Multi-protocol support (SAML 2.0 and OpenID Connect)
- Encrypted storage for sensitive data (certificates, client secrets) using AES-256-GCM
- Auto-provisioning with domain restrictions
- Flexible attribute mapping
- Support for major providers: Okta, Azure AD, Google Workspace, Generic SAML/OIDC

#### 2. SSO Module
**Location**: `apps/backend/src/modules/sso/`

**Components**:
- **`sso.service.ts`**: Core SSO provider management with encryption/decryption
- **`services/saml-sp.service.ts`**: SAML 2.0 Service Provider implementation
- **`services/oidc-client.service.ts`**: OpenID Connect Relying Party with PKCE
- **`sso.controller.ts`**: Provider management API (JWT protected)
- **`sso-auth.controller.ts`**: Public authentication endpoints
- **DTOs**: Type-safe request validation for create/update operations

**Libraries Used**:
- `@node-saml/passport-saml` (v5.x) - SAML 2.0 implementation
- `openid-client` (v6.8.2) - OpenID Connect client with PKCE support
- Native Node.js `crypto` for AES-256-GCM encryption

#### 3. API Endpoints

**Provider Management** (Authenticated - requires JWT):
```
GET    /api/v1/organizations/:orgId/sso/providers          # List all providers
GET    /api/v1/organizations/:orgId/sso/providers/:id     # Get one provider
POST   /api/v1/organizations/:orgId/sso/providers         # Create provider
PUT    /api/v1/organizations/:orgId/sso/providers/:id     # Update provider
DELETE /api/v1/organizations/:orgId/sso/providers/:id     # Delete provider
```

**SAML Authentication** (Public):
```
GET    /api/v1/sso/saml/:orgId/login?providerId=xxx       # Initiate SAML login
POST   /api/v1/sso/saml/:orgId/acs                        # Assertion Consumer Service
GET    /api/v1/sso/saml/:orgId/metadata                   # SP Metadata XML
```

**OIDC Authentication** (Public):
```
GET    /api/v1/sso/oidc/:providerId/login                 # Initiate OIDC login
GET    /api/v1/sso/oidc/:providerId/callback              # OIDC callback
```

### Frontend UI (Next.js 15 + React 19)

#### 1. SSO Provider Management Dashboard
**Location**: `apps/web/src/app/dashboard/sso/providers/`

**Pages**:
- **`page.tsx`**: Provider list with enable/disable, edit, delete actions
- **`new/page.tsx`**: Create new provider wizard with protocol selection

**Features**:
- Clean, responsive UI with inline styles (no external CSS dependencies)
- Real-time provider status display (enabled/disabled)
- Protocol and provider type badges
- SAML metadata URL display
- Domain restriction management
- Form validation

#### 2. API Client Library
**Location**: `apps/web/src/lib/api.ts`

Type-safe API client with methods for:
- Listing, creating, updating, deleting SSO providers
- Generating SSO login URLs
- TypeScript interfaces for all data models

#### 3. Dashboard Integration
**Updated**: `apps/web/src/app/dashboard/page.tsx`

Added "Manage SSO Providers" quick action button to main dashboard.

---

## Security Features Implemented

### 1. Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Encrypted Fields**:
  - SAML X.509 certificates
  - OIDC client secrets
- **Storage Format**: `iv:authTag:encryptedData` (hex-encoded)
- **Environment Variable**: `ENCRYPTION_KEY` (32-byte hex string)

### 2. PKCE (Proof Key for Code Exchange)
- Mandatory for all OIDC flows
- SHA-256 code challenge method
- Protects against authorization code interception attacks

### 3. CSRF Protection
- State parameter for OIDC flows
- RelayState for SAML flows
- Session-based storage of PKCE verifiers and nonces

### 4. Domain Restrictions
- Optional email domain allowlist per provider
- Prevents unauthorized access from external domains

### 5. Auto-Provisioning Control
- Configurable per provider
- Creates users only from allowed domains
- Sets email as verified on SSO login

---

## How to Run the Project

### Prerequisites
- Node.js 20+
- pnpm (install: `npm install -g pnpm`)
- PostgreSQL database (Neon.tech, Supabase, or local)
- Environment variables configured

### Step 1: Set Up Environment Variables

Create `apps/backend/.env`:
```bash
# Database (Neon.tech or Supabase)
DATABASE_URL="postgresql://user:pass@your-host.neon.tech/sutraid"

# JWT Keys (generate with: openssl genrsa -out private.pem 2048)
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# Encryption key (32 bytes hex: openssl rand -hex 32)
ENCRYPTION_KEY="64-character-hex-string-here"

# Backend URL (for SSO callbacks)
BACKEND_URL="http://localhost:3000"

# Frontend URL (for redirects after auth)
FRONTEND_URL="http://localhost:3001"

# Optional: Email service (Resend)
RESEND_API_KEY="re_xxx"
EMAIL_FROM="noreply@yourdomain.com"
```

Create `apps/web/.env.local`:
```bash
NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"
```

### Step 2: Generate Encryption Key
```bash
# Generate 32-byte (256-bit) encryption key
openssl rand -hex 32

# Add to apps/backend/.env as ENCRYPTION_KEY
```

### Step 3: Install Dependencies
```bash
# From project root
pnpm install
```

### Step 4: Run Database Migrations
```bash
cd apps/backend
pnpm prisma generate
pnpm prisma migrate dev
```

### Step 5: Start Backend
```bash
# Terminal 1: Backend (runs on port 3000)
cd apps/backend
pnpm run dev

# Should see:
# Application is running on: http://localhost:3000
```

### Step 6: Start Frontend
```bash
# Terminal 2: Frontend (runs on port 3001)
cd apps/web
pnpm run dev

# Should see:
# ▲ Next.js 15.1.6
# - Local: http://localhost:3001
```

### Step 7: Access the Application
1. **Login**: http://localhost:3001/login
2. **Dashboard**: http://localhost:3001/dashboard (after login)
3. **SSO Providers**: http://localhost:3001/dashboard/sso/providers
4. **Backend API**: http://localhost:3000/api/v1

---

## Testing the SSO Implementation

### Test SAML Integration

1. **Create SAML Provider**:
   - Go to http://localhost:3001/dashboard/sso/providers
   - Click "Add SSO Provider"
   - Select SAML 2.0
   - Fill in:
     - Name: "Okta SAML"
     - Type: "Okta"
     - Entity ID: (from Okta admin console)
     - SSO URL: (from Okta admin console)
     - Certificate: (X.509 cert from Okta, PEM format)
   - Enable and save

2. **Configure Okta (or other IdP)**:
   - Create new SAML app in Okta
   - Set ACS URL: `http://localhost:3000/api/v1/sso/saml/{orgId}/acs`
   - Get metadata: `http://localhost:3000/api/v1/sso/saml/{orgId}/metadata`

3. **Test Login**:
   - Visit: `http://localhost:3000/api/v1/sso/saml/{orgId}/login?providerId={providerId}`
   - Should redirect to Okta
   - After login, redirected back with user created

### Test OIDC Integration

1. **Create OIDC Provider**:
   - Go to http://localhost:3001/dashboard/sso/providers
   - Click "Add SSO Provider"
   - Select OpenID Connect
   - Fill in:
     - Name: "Google OAuth"
     - Type: "Google Workspace"
     - Issuer: "https://accounts.google.com"
     - Client ID: (from Google Cloud Console)
     - Client Secret: (from Google Cloud Console)
   - Enable and save

2. **Configure Google Cloud Console**:
   - Create OAuth 2.0 Client ID
   - Add redirect URI: `http://localhost:3000/api/v1/sso/oidc/{providerId}/callback`

3. **Test Login**:
   - Visit: `http://localhost:3000/api/v1/sso/oidc/{providerId}/login`
   - Should redirect to Google
   - After consent, redirected back with user created

---

## Project Structure

```
apps/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── sso/
│   │   │   │   ├── services/
│   │   │   │   │   ├── saml-sp.service.ts       # SAML Service Provider
│   │   │   │   │   └── oidc-client.service.ts   # OIDC Relying Party
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-sso-provider.dto.ts
│   │   │   │   │   └── update-sso-provider.dto.ts
│   │   │   │   ├── sso.service.ts               # Core SSO logic
│   │   │   │   ├── sso.controller.ts            # Provider management API
│   │   │   │   ├── sso-auth.controller.ts       # Authentication endpoints
│   │   │   │   └── sso.module.ts                # Module definition
│   │   │   ├── organization/                     # Multi-tenancy
│   │   │   ├── application/                      # App management
│   │   │   └── auth/                             # Authentication
│   │   └── app.module.ts
│   └── prisma/
│       └── schema.prisma                         # Database schema
│
└── web/
    ├── src/
    │   ├── app/
    │   │   ├── dashboard/
    │   │   │   ├── sso/
    │   │   │   │   └── providers/
    │   │   │   │       ├── page.tsx              # Provider list
    │   │   │   │       └── new/
    │   │   │   │           └── page.tsx          # Create provider
    │   │   │   ├── page.tsx                      # Dashboard home
    │   │   └── login/
    │   │       └── page.tsx                      # Login page
    │   └── lib/
    │       └── api.ts                            # API client
    └── package.json
```

---

## Database Schema Summary

### SsoProvider
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| organizationId | UUID | Multi-tenant FK |
| name | String | Display name |
| type | Enum | OKTA, AZURE_AD, GOOGLE_WORKSPACE, GENERIC_SAML, GENERIC_OIDC |
| protocol | Enum | SAML2, OIDC |
| enabled | Boolean | Active status |
| autoProvision | Boolean | Create users on first login |
| allowedDomains | String[] | Email domain restrictions |
| samlEntityId | String? | SAML Entity ID |
| samlSsoUrl | String? | SAML SSO URL |
| samlCertificate | String? | X.509 cert (encrypted) |
| samlMetadataUrl | String? | Metadata URL |
| oidcIssuer | String? | OIDC issuer URL |
| oidcClientId | String? | OAuth client ID |
| oidcClientSecret | String? | Client secret (encrypted) |
| oidcScopes | String[] | OAuth scopes |
| attributeMapping | JSON | Custom attribute map |

### SsoIdentity
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | User FK |
| ssoProviderId | UUID | Provider FK |
| externalId | String | Subject ID from IdP |
| externalEmail | String? | Email from IdP |
| issuer | String | IdP identifier |
| attributes | JSON | Full IdP profile |
| firstLoginAt | DateTime | First SSO login |
| lastLoginAt | DateTime | Most recent login |

---

## Next Steps (Phase 2 Remaining)

### 1. Login Page SSO Detection (Pending)
**Goal**: Automatically detect if user's organization has SSO enabled and show provider buttons.

**Implementation**:
- Update `apps/web/src/app/login/page.tsx`
- Add email domain detection
- Query SSO providers by organization domain
- Display "Sign in with [Provider]" buttons
- Redirect to SSO login endpoint

### 2. Additional Enhancements
- [ ] Error handling UI improvements
- [ ] Provider connection testing (validate before save)
- [ ] SAML metadata import from URL
- [ ] OIDC auto-discovery from issuer URL
- [ ] Attribute mapping UI builder
- [ ] SSO login analytics

---

## Known Issues / Limitations

1. **Organization ID Hardcoded**: Currently using `org_demo_123` for demo purposes. Need to implement proper organization context from JWT.

2. **No Edit Page**: Can create and delete providers, but editing requires dedicated edit page (similar to new page).

3. **Session Management**: OIDC flow uses in-memory session. In production, use Redis or database-backed sessions.

4. **Certificate Validation**: SAML certificate validation is basic. Consider adding expiry checks and rotation support.

5. **CORS**: May need CORS configuration for frontend-backend communication in production.

---

## Production Checklist

Before deploying to production:

- [ ] Replace hardcoded `orgId` with JWT-derived organization context
- [ ] Implement proper session storage (Redis)
- [ ] Add rate limiting on authentication endpoints
- [ ] Enable HTTPS (required for SAML/OIDC)
- [ ] Configure custom domain
- [ ] Set up monitoring (Sentry)
- [ ] Add webhook notifications for SSO events
- [ ] Implement provider health checks
- [ ] Add audit logging for all SSO operations
- [ ] Test with multiple IdPs (Okta, Azure AD, Google)
- [ ] Security audit for XSS, CSRF, injection attacks

---

## Troubleshooting

### Backend won't start
```bash
# Check database connection
cd apps/backend
pnpm prisma migrate status

# Regenerate Prisma client
pnpm prisma generate

# Check for TypeScript errors
pnpm run build
```

### Frontend won't connect to backend
```bash
# Verify NEXT_PUBLIC_API_URL in apps/web/.env.local
echo $NEXT_PUBLIC_API_URL

# Check CORS in backend (should allow http://localhost:3001)
# Update apps/backend/src/main.ts if needed
```

### SAML authentication fails
- Verify Entity ID matches between IdP and SutraID
- Check certificate is in PEM format
- Ensure ACS URL is correct in IdP
- Check backend logs for validation errors

### OIDC authentication fails
- Verify Issuer URL is correct (with https://)
- Check Client ID/Secret match IdP
- Ensure redirect URI matches exactly in IdP
- Check PKCE is enabled on IdP (required)

---

## Architecture Decisions

### Why SAML and OIDC?
- **SAML 2.0**: Enterprise standard, required for Okta/Azure AD integration
- **OIDC**: Modern, simpler to implement, better for cloud providers

### Why AES-256-GCM?
- Authenticated encryption (detects tampering)
- NIST recommended
- Native Node.js support

### Why PKCE for OIDC?
- OAuth 2.1 best practice
- Prevents authorization code interception
- Required by some providers (e.g., Auth0)

### Why Session Storage for PKCE Verifier?
- Stateful server-side flow
- More secure than localStorage
- Prevents replay attacks

---

## Support

For issues or questions:
- Check logs: `apps/backend/logs/` (if configured)
- Review error messages in browser console
- Check database schema: `pnpm prisma studio` (visual DB explorer)
- Backend logs: Terminal running `pnpm run dev`

---

**Phase 2 Status**: ✅ **Backend Complete** | ✅ **Frontend UI Complete** | ⏳ **Login Page SSO Detection Pending**

Built with ❤️ using NestJS, Next.js, Prisma, PostgreSQL, @node-saml/passport-saml, and openid-client.
