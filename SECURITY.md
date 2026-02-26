# Security Policy

SutraID is an authentication and authorization platform, and security is a core concern.  
This document explains how to report vulnerabilities and how we handle security-related issues.

---

## Supported Versions

This project is currently pre-1.0 and under active development.  
Unless explicitly stated otherwise, **the latest `main` and `dev` branches** are supported for security fixes.

---

## Reporting a Vulnerability

If you believe you have found a security vulnerability in SutraID, **please do not open a public issue**.
Instead, choose one of the following private disclosure options:

### GitHub Security Advisory (Preferred)

1. Go to https://github.com/gowthamkiam/SutraID/security/advisories
2. Click "Report a vulnerability"
3. Fill in the details:
   - **Title**: Brief description of the vulnerability
   - **Description**: Detailed explanation with reproduction steps
   - **Severity**: Your assessment (Low, Medium, High, Critical)
   - **Affected versions**: Which versions are vulnerable
   - **Proof of concept**: Code or steps to reproduce

### Encrypted Email (PGP)

For especially sensitive vulnerabilities, you can send an encrypted email:

**PGP Public Key**: [Link to PGP key or key fingerprint when available]

**Email**: security@sutraid.com (or maintainer email)

### What to Include

When reporting, please include:

- A clear description of the issue
- Steps to reproduce (if possible)
- Any proof-of-concept code or configuration
- The impact you believe the issue may have
- Any known workarounds
- Your preferred contact method for follow-up

### Responsible Disclosure Guidelines

We kindly ask you to:

- Give us a reasonable amount of time to investigate and respond
- Avoid exploiting the vulnerability beyond what is necessary to prove it exists
- Avoid accessing, modifying, or deleting data that does not belong to you
- Do not publicly disclose the vulnerability until we have released a fix

---

## What Happens Next

After receiving your report, maintainers will:

1. **Acknowledgment** (within 48 hours): We'll confirm receipt of your report
2. **Triage** (within 1 week): We'll assess the severity and impact
3. **Fix Development** (1-2 weeks): We'll develop and test a patch
4. **Coordinated Disclosure** (negotiated): We'll agree on a public disclosure date
5. **Release & Advisory** (disclosure date): We'll release the fix and publish an advisory
6. **Credit**: We'll credit you in the advisory (unless you prefer to remain anonymous)

### Response Time SLA

We strive to respond according to the following timeline:

- **Critical vulnerabilities** (e.g., authentication bypass, RCE): Response within 24 hours, patch within 1 week
- **High vulnerabilities** (e.g., privilege escalation, data exposure): Response within 48 hours, patch within 2 weeks
- **Medium/Low vulnerabilities**: Response within 1 week, patch in next release

We aim to handle security issues promptly and transparently, while minimizing risk to users.

---

## Scope

### In Scope

The following areas are within scope for security vulnerability reports:

- **Authentication bypass**: Circumventing login, MFA, or session validation
- **Authorization issues**: Privilege escalation, accessing other users' data
- **Injection vulnerabilities**: SQL injection, XSS, CSRF, command injection
- **Sensitive data exposure**: Leaking credentials, tokens, PII
- **Cryptographic weaknesses**: Weak algorithms, key management issues
- **Denial of Service (DoS)**: Crashes, resource exhaustion, algorithmic complexity attacks

### Out of Scope

The following are generally **not** considered security vulnerabilities:

- **Social engineering attacks**: Phishing, vishing, or similar attacks against users
- **Physical attacks**: Direct physical access to servers or infrastructure
- **Third-party dependency issues**: Please report these to the dependency maintainers first, then notify us once patched
- **Self-XSS**: Vulnerabilities requiring the user to manually paste malicious code
- **Denial of Service via spam**: Rate limiting may not prevent all abuse scenarios
- **Issues in outdated versions**: Only the latest `main` and `dev` branches are supported

---

## Bug Bounty Program

**Status**: Not currently available

We are a small open-source project and do not have a formal bug bounty program at this time. However, we deeply appreciate security research and will publicly acknowledge your contribution (with your permission) in:

- CHANGELOG.md security advisory
- GitHub security advisory
- Release notes

### Hall of Fame

Security researchers who have helped improve SutraID:

- [Coming soon]

---

## Security Best Practices for Deployers

When deploying SutraID (especially to production):

- **Secrets management**
  - Store secrets (JWT secrets, database URLs, encryption keys, email provider keys, etc.) only in environment variables or your platform’s secure secret store.
  - Never commit secrets to git, Dockerfiles, or images.
  - Rotate secrets regularly, especially if there is any suspicion of exposure.

- **Transport security**
  - Use HTTPS for all external traffic.
  - Terminate TLS at a secure reverse proxy, load balancer, or managed ingress.

- **Database and infrastructure**
  - Use least-privilege database accounts.
  - Restrict access to your PostgreSQL instance by IP/network where possible.
  - Keep Postgres and all system packages patched.

- **Application configuration**
  - Set `NODE_ENV=production` in production environments.
  - Ensure CORS and allowed origins are configured correctly.
  - Disable or protect any debugging or development-only endpoints.

- **Monitoring and logging**
  - Enable audit logging in production.
  - Monitor for unusual authentication patterns and failed login attempts.
  - Keep an eye on error logs for exceptions that may indicate misconfiguration or attacks.

---

## Responsible Use

SutraID is provided under the MIT License (see `LICENSE`).  
Running SutraID in production is your responsibility, including:

- Choosing appropriate deployment infrastructure
- Configuring and protecting secrets
- Complying with all relevant laws and regulations

If you have questions about hardening or securely deploying SutraID, please open a **general question issue** (not a vulnerability report), keeping sensitive details out of public threads.

