'use client';

import Link from 'next/link';

const sections = [
  {
    title: 'Authentication & MFA',
    href: '/docs/api-reference/authentication',
    description:
      'Magic links, password auth, TOTP enrollment, passkeys, backup codes, and adaptive MFA.',
    count: 18,
  },
  {
    title: 'Settings & Configuration',
    href: '/docs/api-reference/settings',
    description:
      'Instance settings, branding configuration, onboarding, and session statistics.',
    count: 6,
  },
  {
    title: 'Users',
    href: '/docs/api-reference/users',
    description:
      'Create, update, delete users and manage group and application assignments.',
    count: 6,
  },
  {
    title: 'Groups',
    href: '/docs/api-reference/groups',
    description:
      'User group management, membership operations, and application assignments.',
    count: 6,
  },
  {
    title: 'Applications',
    href: '/docs/api-reference/applications',
    description:
      'OIDC and SAML app registration, OAuth 2.0 token operations, and dynamic client registration.',
    count: 15,
  },
  {
    title: 'SSO',
    href: '/docs/api-reference/sso',
    description:
      'SSO provider configuration (SAML 2.0 & OIDC), domain discovery, and authentication flows.',
    count: 12,
  },
  {
    title: 'OIDC Provider',
    href: '/docs/api-reference/oidc-provider',
    description:
      'SutraID as an OpenID Connect Identity Provider — authorize, token, userinfo, JWKS.',
    count: 9,
  },
  {
    title: 'SAML Provider',
    href: '/docs/api-reference/saml-provider',
    description:
      'SutraID as a SAML 2.0 Identity Provider — metadata and SSO endpoints.',
    count: 3,
  },
  {
    title: 'OIDC Configuration',
    href: '/docs/api-reference/oidc-config',
    description:
      'Custom scopes, claims, regex rules, signing keys, and token policy management for OIDC applications.',
    count: 11,
  },
  {
    title: 'Audit Logs',
    href: '/docs/api-reference/audit',
    description:
      'Immutable audit trail — query logs by action, result, date range, and view aggregated stats.',
    count: 2,
  },
  {
    title: 'Policies',
    href: '/docs/api-reference/policies',
    description:
      'Authorization policies (ABAC), password policies, and real-time policy evaluation engine.',
    count: 8,
  },
  {
    title: 'Directory (SCIM & LDAP)',
    href: '/docs/api-reference/directory',
    description:
      'SCIM 2.0 provisioning, LDAP synchronization, and directory integration for user/group sync.',
    count: 18,
  },
];

export default function DocsHomePage() {
  return (
    <div>
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          color: 'var(--text-primary)',
          letterSpacing: '-0.03em',
          marginBottom: '0.75rem',
          marginTop: 0,
        }}
      >
        SutraID API Reference
      </h1>
      <p
        style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: '1rem',
          maxWidth: '700px',
        }}
      >
        Complete REST API documentation for the SutraID CIAM platform. Build
        authentication, SSO, user management, and directory integration into your
        applications.
      </p>
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '3rem',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            background: 'var(--bg-badge)',
            border: '1px solid var(--border-color)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.83rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          Base URL:{' '}
          <code style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
            https://api.sutraid.com/api/v1
          </code>
        </div>
        <div
          style={{
            background: 'var(--bg-badge)',
            border: '1px solid var(--border-color)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.83rem',
            color: 'var(--text-secondary)',
          }}
        >
          127 endpoints
        </div>
        <div
          style={{
            background: 'var(--bg-badge)',
            border: '1px solid var(--border-color)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.83rem',
            color: 'var(--text-secondary)',
          }}
        >
          REST + JSON
        </div>
      </div>

      {/* Section cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {sections.map((s) => (
          <Link key={s.href} href={s.href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.5rem',
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-card)',
                transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                height: '100%',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--accent-primary)';
                el.style.boxShadow = 'var(--shadow-elevated)';
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--border-color)';
                el.style.boxShadow = 'var(--shadow-card)';
                el.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '0.5rem',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                  }}
                >
                  {s.title}
                </h3>
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: 'var(--accent-light)',
                    color: 'var(--accent-text)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.count} endpoints
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                }}
              >
                {s.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
