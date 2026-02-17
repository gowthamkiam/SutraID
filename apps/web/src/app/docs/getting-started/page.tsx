'use client';

import Link from 'next/link';

export default function GettingStartedPage() {
  return (
    <div style={{ maxWidth: '760px' }}>
      <h1
        style={{
          fontSize: '2.2rem',
          fontWeight: 900,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginTop: 0,
          marginBottom: '0.75rem',
        }}
      >
        Getting Started
      </h1>
      <p
        style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
        }}
      >
        Get up and running with the SutraID API in under 5 minutes. This guide
        walks you through authentication, making your first API call, and
        handling responses.
      </p>

      {/* Step 1 */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <span
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            1
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Create an Account
          </h2>
        </div>
        <p
          style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '1rem',
          }}
        >
          Register a new account using the authentication API. This will create
          your user and an organization automatically.
        </p>
        <pre
          style={{
            background: '#0f1923',
            color: '#e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem',
            fontSize: '0.83rem',
            lineHeight: 1.6,
            overflowX: 'auto',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          <code>{`curl -X POST https://api.sutraid.com/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "developer@yourcompany.com",
    "password": "YourSecurePassword123!"
  }'`}</code>
        </pre>
      </div>

      {/* Step 2 */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <span
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            2
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Get Your Access Token
          </h2>
        </div>
        <p
          style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '1rem',
          }}
        >
          The registration response includes an{' '}
          <code
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--accent-text)',
              background: 'var(--accent-light)',
              padding: '1px 5px',
              borderRadius: '4px',
              fontSize: '0.88rem',
            }}
          >
            accessToken
          </code>{' '}
          (JWT, 15-minute expiry) and a{' '}
          <code
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--accent-text)',
              background: 'var(--accent-light)',
              padding: '1px 5px',
              borderRadius: '4px',
              fontSize: '0.88rem',
            }}
          >
            refreshToken
          </code>{' '}
          (30-day expiry). Use the access token in the{' '}
          <code
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.88rem',
            }}
          >
            Authorization
          </code>{' '}
          header for all authenticated requests.
        </p>
        <pre
          style={{
            background: '#0f1923',
            color: '#e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem',
            fontSize: '0.83rem',
            lineHeight: 1.6,
            overflowX: 'auto',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          <code>{`{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "usr_abc123",
    "email": "developer@yourcompany.com",
    "organizationId": "org_xyz789",
    "role": "SUPER_ADMIN"
  },
  "organization": {
    "id": "org_xyz789",
    "name": "Your Company",
    "slug": "your-company"
  }
}`}</code>
        </pre>
      </div>

      {/* Step 3 */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <span
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            3
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Make Authenticated Requests
          </h2>
        </div>
        <p
          style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '1rem',
          }}
        >
          Include the access token in the{' '}
          <code
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.88rem',
            }}
          >
            Authorization: Bearer
          </code>{' '}
          header to access protected endpoints.
        </p>
        <pre
          style={{
            background: '#0f1923',
            color: '#e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem',
            fontSize: '0.83rem',
            lineHeight: 1.6,
            overflowX: 'auto',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          <code>{`curl https://api.sutraid.com/api/v1/auth/me \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Response:
# { "user": { "id": "usr_abc123", "email": "developer@yourcompany.com", ... } }`}</code>
        </pre>
      </div>

      {/* Step 4 */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <span
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            4
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: '1.3rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Create an Application
          </h2>
        </div>
        <p
          style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '1rem',
          }}
        >
          Register an OIDC or SAML application to enable SSO for your users.
        </p>
        <pre
          style={{
            background: '#0f1923',
            color: '#e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem',
            fontSize: '0.83rem',
            lineHeight: 1.6,
            overflowX: 'auto',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          <code>{`curl -X POST https://api.sutraid.com/api/v1/organizations/org_xyz789/applications \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Web App",
    "type": "OIDC",
    "redirectUris": ["https://myapp.com/callback"],
    "grantTypes": ["authorization_code", "refresh_token"],
    "scopes": ["openid", "profile", "email"]
  }'`}</code>
        </pre>
      </div>

      {/* Next steps */}
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.5rem',
          background: 'var(--bg-card)',
        }}
      >
        <h3
          style={{
            margin: '0 0 1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            fontSize: '1.1rem',
          }}
        >
          Next Steps
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link
            href="/docs/authentication"
            style={{
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.925rem',
            }}
          >
            &rarr; Learn about authentication concepts (JWT, sessions, MFA)
          </Link>
          <Link
            href="/docs/api-reference/authentication"
            style={{
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.925rem',
            }}
          >
            &rarr; Explore the full Authentication API reference
          </Link>
          <Link
            href="/docs/api-reference/sso"
            style={{
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.925rem',
            }}
          >
            &rarr; Set up SSO for your organization
          </Link>
          <Link
            href="/docs/errors"
            style={{
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.925rem',
            }}
          >
            &rarr; Understand error codes and handling
          </Link>
        </div>
      </div>
    </div>
  );
}
