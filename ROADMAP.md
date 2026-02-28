# SutraID Security Roadmap

This roadmap outlines planned security features aligned with the [CISA Secure-by-Design Pledge](https://www.cisa.gov/securebydesign).

## Q1 2026 — Foundation (Complete)

- [x] Helmet.js security headers (CSP, HSTS, X-Frame-Options)
- [x] Dependabot automated dependency scanning
- [x] CodeQL static analysis in CI/CD
- [x] CycloneDX SBOM generation
- [x] Rate limiting on authentication endpoints
- [x] Password complexity validation with common password checks
- [x] Enhanced SECURITY.md with VDP and SLA
- [x] CHANGELOG.md for security fix tracking

## Q2 2026 — Hardening (In Progress)

- [x] MFA enforcement policy with grace period
- [x] WebAuthn/Passkey (FIDO2) support with attestation verification
- [x] Security metrics dashboard (MFA adoption, failed logins, audit events)
- [ ] CSRF token validation for state-changing endpoints
- [ ] Account lockout after repeated failed login attempts
- [ ] Session anomaly detection (IP change, device fingerprint)

## Q3 2026 — Advanced Security

- [ ] Risk-based adaptive authentication
- [ ] IP allowlist / Network Zone policies
- [ ] Password history tracking (prevent reuse)
- [ ] Automated security regression tests
- [ ] Dependency license compliance scanning
- [ ] API rate limiting per-tenant with configurable thresholds

## Q4 2026 — Enterprise & Compliance

- [ ] SOC 2 Type II readiness documentation
- [ ] SIEM integration (webhook-based audit log export)
- [ ] Passwordless-first default (passkeys as primary)
- [ ] External bug bounty program
- [ ] Formal third-party security audit
- [ ] HSM/KMS integration for key management

---

## How to Contribute

Security contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
Report vulnerabilities via [SECURITY.md](SECURITY.md).
