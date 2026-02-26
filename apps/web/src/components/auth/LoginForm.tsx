'use client';

import { useState, useEffect, useRef } from 'react';
import { ssoApi } from '@/lib/api';

export interface CustomLoginConfig {
  logoUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
  customCss?: string;
  customHtmlTemplate?: string;
}

interface LoginFormProps {
  organizationId: string;
  organizationName: string;
  branding?: CustomLoginConfig | null;
}

type AuthMode = 'magic-link' | 'password';

interface SsoProviderInfo {
  id: string;
  name: string;
  type: string;
  protocol: string;
  organizationId: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.875rem 1rem',
  border: '1.5px solid #d1d5db',
  borderRadius: '10px',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
  color: '#111827',
  background: '#fff',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: 500,
  fontSize: '0.875rem',
  color: '#374151',
};

function handleInputFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = '#4f46e5';
  e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
}

function handleInputBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = '#d1d5db';
  e.target.style.boxShadow = 'none';
}

export default function LoginForm({ organizationId, organizationName, branding }: LoginFormProps) {
  const [mode, setMode] = useState<AuthMode>('magic-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ssoProviders, setSsoProviders] = useState<SsoProviderInfo[]>([]);
  const [ssoLoading, setSsoLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);

  const accent = branding?.primaryColor || '#4f46e5';
  const accentHover = branding?.primaryColor ? darkenHex(branding.primaryColor, 15) : '#4338ca';

  const redirectAfterLogin = (_accessToken: string) => {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl');
    if (returnUrl) {
      window.location.href = decodeURIComponent(returnUrl);
      return;
    }
    window.location.href = '/dashboard';
  };

  const getProviderIcon = (type: string) => {
    const icons: Record<string, string> = {
      OKTA: 'O', AZURE_AD: 'M', GOOGLE_WORKSPACE: 'G',
      GENERIC_SAML: 'S', GENERIC_OIDC: 'C',
    };
    return icons[type] || 'S';
  };

  const getProviderLabel = (type: string) => {
    const labels: Record<string, string> = {
      OKTA: 'Okta', AZURE_AD: 'Microsoft', GOOGLE_WORKSPACE: 'Google',
      GENERIC_SAML: 'SAML SSO', GENERIC_OIDC: 'OIDC SSO',
    };
    return labels[type] || 'SSO';
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const atIndex = email.indexOf('@');
    if (atIndex === -1 || atIndex === email.length - 1) {
      setSsoProviders([]);
      return;
    }

    const domain = email.substring(atIndex + 1);
    if (!domain.includes('.')) {
      setSsoProviders([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSsoLoading(true);
      try {
        const result = await ssoApi.discoverProviders(domain);
        setSsoProviders(result.providers || []);
      } catch {
        setSsoProviders([]);
      } finally {
        setSsoLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email]);

  const handleSsoLogin = (provider: SsoProviderInfo) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    if (provider.protocol === 'SAML2') {
      window.location.href = `${apiUrl}/sso/saml/${provider.organizationId}/login?providerId=${provider.id}`;
    } else {
      window.location.href = `${apiUrl}/sso/oidc/${provider.id}/login`;
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setMessage('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

    try {
      if (mode === 'magic-link') {
        const response = await fetch(`${apiUrl}/auth/magic-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to send magic link');
        setMessage(data.message || 'Magic link sent! Check your email.');
      } else if (mode === 'password') {
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password, organizationId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Invalid email or password');

        if (data.mfaRequired) {
          setMfaRequired(true);
          setMfaToken(data.mfaToken);
          setMessage('Enter the 6-digit code from your authenticator app');
          setLoading(false);
          return;
        }

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        const orgId = data.organization?.id || data.user?.organizationId;
        if (orgId) localStorage.setItem('currentOrgId', orgId);
        if (data.mustChangePassword || data.user?.mustChangePassword) {
          window.location.href = '/auth/change-password';
          return;
        }
        redirectAfterLogin(data.accessToken);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

    try {
      const response = await fetch(`${apiUrl}/auth/mfa/verify-challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mfaToken, code: mfaCode, isBackupCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Invalid authentication code');

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      const orgId = data.organization?.id || data.user?.organizationId;
      if (orgId) localStorage.setItem('currentOrgId', orgId);
      if (data.mustChangePassword || data.user?.mustChangePassword) {
        window.location.href = '/auth/change-password';
        return;
      }
      redirectAfterLogin(data.accessToken);
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelMfa = () => {
    setMfaRequired(false);
    setMfaToken('');
    setMfaCode('');
    setIsBackupCode(false);
    setMessage('');
    setError('');
  };

  const getHeading = () => {
    return `Sign in to ${organizationName}`;
  };

  const getButtonLabel = () => {
    if (loading) {
      if (mode === 'magic-link') return 'Sending...';
      return 'Signing in...';
    }
    if (mode === 'magic-link') return 'Send Magic Link';
    return 'Sign In';
  };

  return (
    <>
      {branding?.customCss && <style dangerouslySetInnerHTML={{ __html: branding.customCss }} />}

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
        {branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={organizationName}
            style={{ maxHeight: '48px', maxWidth: '200px', objectFit: 'contain' }}
          />
        ) : (
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.5px',
            color: '#111827',
          }}>
            <span style={{ color: accent }}>S</span>utra
            <span style={{ color: accent }}>ID</span>
          </h1>
        )}
      </div>

      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ color: '#374151', fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>
          {mfaRequired ? 'Two-Factor Authentication' : getHeading()}
        </p>
      </div>

      {/* MFA Challenge Form */}
      {mfaRequired ? (
        <form onSubmit={handleMfaVerify}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="mfaCode" style={labelStyle}>
              {isBackupCode ? 'Backup Code' : 'Authentication Code'}
            </label>
            <input
              id="mfaCode"
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\s/g, ''))}
              required
              placeholder={isBackupCode ? '8-character backup code' : '6-digit code'}
              maxLength={isBackupCode ? 8 : 6}
              style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.25rem', fontWeight: 600 }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#6b7280', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isBackupCode}
                onChange={(e) => { setIsBackupCode(e.target.checked); setMfaCode(''); }}
                style={{ cursor: 'pointer' }}
              />
              Use a backup code instead
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.9rem', background: loading ? '#9ca3af' : accent,
              color: '#fff', border: 'none', borderRadius: '50px', fontSize: '1rem',
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = accentHover; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = accent; }}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>

          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={cancelMfa}
              style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
              onMouseEnter={(e) => e.currentTarget.style.color = accent}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
            >
              Back to login
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="orgId" value={organizationId} />

          {/* Email */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="email" style={labelStyle}>Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          {/* Password field (password mode) */}
          {mode === 'password' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                {mode === 'password' && (
                  <a
                    href="/forgot-password"
                    style={{ fontSize: '0.8rem', color: accent, textDecoration: 'none', fontWeight: 500, marginBottom: '0.5rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    Forgot password?
                  </a>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          )}

          {/* SSO Provider Buttons (only in magic-link mode) */}
          {mode === 'magic-link' && ssoLoading && (
            <div style={{ textAlign: 'center', padding: '0.75rem', color: '#6b7280', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Checking for SSO providers...
            </div>
          )}

          {mode === 'magic-link' && ssoProviders.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                <span style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 500 }}>SSO available for your domain</span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              </div>

              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {ssoProviders.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleSsoLogin(provider)}
                    style={{
                      width: '100%', padding: '0.8rem', background: '#fff', color: '#374151',
                      border: '1.5px solid #d1d5db', borderRadius: '50px', fontSize: '0.95rem',
                      fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = accent; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                  >
                    <span style={{
                      width: '24px', height: '24px', borderRadius: '6px', background: '#eef2ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: accent,
                    }}>
                      {getProviderIcon(provider.type)}
                    </span>
                    Sign in with {provider.name || getProviderLabel(provider.type)}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>or use magic link</span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.9rem', background: loading ? '#9ca3af' : accent,
              color: '#fff', border: 'none', borderRadius: '50px', fontSize: '1rem',
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s, transform 0.1s', letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = accentHover; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = accent; }}
          >
            {getButtonLabel()}
          </button>
        </form>
      )}

      {/* Status messages */}
      {message && (
        <div style={{
          marginTop: '1.25rem', padding: '1rem', background: '#ecfdf5',
          border: '1px solid #a7f3d0', borderRadius: '10px', color: '#065f46',
          fontSize: '0.9rem', textAlign: 'center',
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '1.25rem', padding: '1rem', background: '#fef2f2',
          border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b',
          fontSize: '0.9rem', textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* Mode toggle links */}
      {!mfaRequired && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          {mode === 'magic-link' && (
            <>
              <button
                type="button"
                onClick={() => switchMode('password')}
                style={{ background: 'none', border: 'none', color: accent, fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', padding: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Sign in with password
              </button>
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{"Don't have an account? "}</span>
                <a
                  href="/onboard"
                  style={{ color: accent, fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Sign up for a new organization
                </a>
              </div>
            </>
          )}

          {mode === 'password' && (
            <>
              <button
                type="button"
                onClick={() => switchMode('magic-link')}
                style={{ background: 'none', border: 'none', color: accent, fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'none', padding: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Sign in with magic link
              </button>
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{"Don't have an account? "}</span>
                <a
                  href="/onboard"
                  style={{ color: accent, fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Sign up for a new organization
                </a>
              </div>
            </>
          )}

        </div>
      )}
    </>
  );
}

function darkenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xFF) - Math.round(255 * percent / 100));
  const g = Math.max(0, ((num >> 8) & 0xFF) - Math.round(255 * percent / 100));
  const b = Math.max(0, (num & 0xFF) - Math.round(255 * percent / 100));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
