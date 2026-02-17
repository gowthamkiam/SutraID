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

- **GitHub Security Advisory (preferred)**  
  Use GitHub’s “Report a vulnerability” / “Security advisory” feature on the repository if available.

- **Private contact**  
  If a security contact email is configured for this project on GitHub or in the repository metadata, use that email for initial disclosure.

When reporting, please include:

- A clear description of the issue
- Steps to reproduce (if possible)
- Any proof-of-concept code or configuration
- The impact you believe the issue may have
- Any known workarounds

We kindly ask you to:

- Give us a reasonable amount of time to investigate and respond.
- Avoid exploiting the vulnerability beyond what is necessary to prove it exists.
- Avoid accessing, modifying, or deleting data that does not belong to you.

---

## What Happens Next

After receiving your report, maintainers will:

1. Acknowledge receipt as soon as reasonably possible.
2. Investigate and verify the vulnerability.
3. Determine the scope, impact, and severity.
4. Develop a fix and associated tests.
5. Prepare a release or patch.
6. Coordinate a responsible disclosure, which may include:
   - A security advisory
   - A changelog entry
   - High-level description of the issue and mitigation steps

We aim to handle security issues promptly and transparently, while minimizing risk to users.

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

