# Changelog

All notable changes to SutraID will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- Added Dependabot for automated dependency updates
- Added CodeQL static analysis to CI/CD pipeline
- Implemented SBOM generation for supply chain transparency

---

## [0.1.0] - 2026-02-26

### Added
- Core authentication (passwordless magic links, password-based)
- TOTP MFA with backup codes
- SAML 2.0 and OIDC Service Provider mode
- Multi-tenant organization support
- Policy engine for authorization
- Audit logging
- SCIM and LDAP directory integration
- AI agent identity support (client_credentials with PKCE)
- OAuth 2.1 and OIDC Provider capabilities

### Security
- Bcrypt password hashing with 10+ rounds
- AES-256-GCM encryption for MFA secrets
- JWT with HS256, 15-minute access token expiry
- HttpOnly, Secure, SameSite cookies
- Prisma ORM for SQL injection protection
- Input validation with class-validator
- Comprehensive SECURITY.md vulnerability disclosure program

---

## Security Advisory Format

When publishing security fixes, use this format:

### [Version] - YYYY-MM-DD

#### Security Fixes
- **[SEVERITY]** Brief description of vulnerability
  - **CVE**: CVE-YYYY-XXXXX (if assigned)
  - **Impact**: Who is affected and how
  - **Credit**: Researcher name (if applicable)
  - **Mitigation**: Upgrade to version X.X.X
  - **Workaround**: Temporary mitigation steps (if any)

#### Example:

### [0.1.1] - 2026-03-15

#### Security Fixes
- **[HIGH]** Rate limiting bypass on password reset endpoint
  - **Impact**: Attackers could enumerate user accounts via password reset
  - **Credit**: Security Researcher Jane Doe
  - **Mitigation**: Upgrade to 0.1.1 immediately
  - **Fix**: Implemented rate limiting on /api/v1/auth/forgot-password
