import Link from 'next/link';

export default function AuthConceptsPage() {
  const codeStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--accent-text)',
    background: 'var(--accent-light)',
    padding: '1px 5px',
    borderRadius: '4px',
    fontSize: '0.88rem',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '3rem',
  };

  const preStyle: React.CSSProperties = {
    background: '#0f1923',
    color: '#e2e8f0',
    borderRadius: '10px',
    padding: '1.25rem',
    fontSize: '0.83rem',
    lineHeight: 1.6,
    overflowX: 'auto',
    fontFamily: 'var(--font-mono, monospace)',
  };

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
        Authentication Guide
      </h1>
      <p
        style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
        }}
      >
        Understand how SutraID handles authentication, JWT tokens, sessions, and
        multi-factor authentication.
      </p>

      {/* JWT Tokens */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          JWT Tokens
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          SutraID uses JSON Web Tokens (JWT) signed with HS256 for authentication.
          Every successful login returns two tokens:
        </p>
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            overflow: 'hidden',
            marginTop: '1rem',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg-badge)',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.6rem 1rem',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Token
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.6rem 1rem',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Expiry
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.6rem 1rem',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Usage
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.6rem 1rem' }}>
                  <code style={codeStyle}>accessToken</code>
                </td>
                <td style={{ padding: '0.6rem 1rem', color: 'var(--text-secondary)' }}>
                  15 minutes
                </td>
                <td style={{ padding: '0.6rem 1rem', color: 'var(--text-secondary)' }}>
                  Include in <code style={codeStyle}>Authorization: Bearer</code> header
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.6rem 1rem' }}>
                  <code style={codeStyle}>refreshToken</code>
                </td>
                <td style={{ padding: '0.6rem 1rem', color: 'var(--text-secondary)' }}>
                  30 days
                </td>
                <td style={{ padding: '0.6rem 1rem', color: 'var(--text-secondary)' }}>
                  Exchange for a new access token when expired
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p
          style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginTop: '1rem',
          }}
        >
          The JWT payload includes a <code style={codeStyle}>jti</code> (JWT ID)
          that links to a server-side session. Sessions can be revoked at any
          time, immediately invalidating the token.
        </p>
      </div>

      {/* Auth Methods */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Authentication Methods
        </h2>

        <h3
          style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          Magic Link (Passwordless)
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          Request a one-time login link sent to the user&apos;s email. The token
          expires after 15 minutes and is SHA-256 hashed before storage. If the
          user doesn&apos;t exist, an account is auto-created on the first magic link
          request.
        </p>

        <h3
          style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          Password
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          Standard email + password authentication. Passwords are hashed with
          bcrypt (12 rounds). Minimum 8 characters required. Supports password
          reset via email token.
        </p>

        <h3
          style={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          SSO (SAML 2.0 & OIDC)
        </h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Federated login via external identity providers (Okta, Azure AD,
          Google Workspace, or any SAML/OIDC provider). Supports PKCE for OIDC
          flows. See the{' '}
          <Link
            href="/docs/api-reference/sso"
            style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}
          >
            SSO API reference
          </Link>{' '}
          for details.
        </p>
      </div>

      {/* MFA */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Multi-Factor Authentication
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
          SutraID supports TOTP-based MFA with backup codes. When MFA is enabled,
          the login response returns <code style={codeStyle}>mfaRequired: true</code>{' '}
          with a temporary <code style={codeStyle}>mfaToken</code>. The client
          must then call the MFA verification endpoint to complete the login.
        </p>

        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          MFA Login Flow
        </h3>
        <pre style={preStyle}>
          <code>{`1. POST /auth/login → { mfaRequired: true, mfaToken: "tmp_..." }
2. User enters TOTP code from authenticator app
3. POST /auth/mfa/verify-challenge → { accessToken, refreshToken, user }
   Body: { mfaToken: "tmp_...", code: "123456" }`}</code>
        </pre>
      </div>

      {/* RBAC */}
      <div style={sectionStyle}>
        <h2
          style={{
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Role-Based Access Control
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
          Every organization member has a role that determines which API
          endpoints they can access. The role is included in the JWT payload and
          enforced server-side.
        </p>
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg-badge)',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 1rem',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Role
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 1rem',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['SUPER_ADMIN', 'Full control, including organization-level settings and deletion'],
                ['ORG_ADMIN', 'Manage members, apps, policies, and settings'],
                ['APP_ADMIN', 'Manage applications and SSO integrations'],
                ['USER_ADMIN', 'Manage users and view groups'],
                ['GROUP_MEMBERSHIP_ADMIN', 'Manage groups and view users'],
                ['HELP_DESK_ADMIN', 'Read/update users (password resets, unlocks)'],
                ['READ_ONLY_ADMIN', 'View-only access to all resources'],
                ['REPORT_ADMIN', 'Audit logs and reporting access'],
                ['API_ACCESS_MANAGEMENT_ADMIN', 'Manage API keys, SSO, and directory'],
              ].map(([role, desc], i, arr) => (
                <tr
                  key={role}
                  style={{
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  <td style={{ padding: '0.5rem 1rem' }}>
                    <code style={codeStyle}>{role}</code>
                  </td>
                  <td style={{ padding: '0.5rem 1rem', color: 'var(--text-secondary)' }}>
                    {desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
