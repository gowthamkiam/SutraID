'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ssoApi } from '@/lib/api';

export interface CustomLoginConfig {
  logoUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
  customCss?: string;
  customHtmlTemplate?: string;
}

interface LoginFormProps {
  branding?: CustomLoginConfig | null;
}

type AuthMode = 'magic-link' | 'password';

interface SsoProviderInfo {
  id: string;
  name: string;
  type: string;
  protocol: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.875rem 1.25rem',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
  color: '#ffffff',
  background: 'rgba(255, 255, 255, 0.05)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.625rem',
  fontWeight: 600,
  fontSize: '0.875rem',
  color: '#9ca3af',
};

function handleInputFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = '#06b6d4';
  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
  e.target.style.boxShadow = '0 0 0 4px rgba(6, 182, 212, 0.15)';
}

function handleInputBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
  e.target.style.boxShadow = 'none';
}

export default function LoginForm({ branding }: LoginFormProps) {
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

  const accent = branding?.primaryColor || '#6366f1';
  const accentHover = branding?.primaryColor ? darkenHex(branding.primaryColor, 15) : '#4f46e5';
  const cyanAccent = '#06b6d4';

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
      window.location.href = `${apiUrl}/sso/saml/login?providerId=${provider.id}`;
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
          body: JSON.stringify({ email, password }),
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
    return 'Sign in to your account';
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
            alt="Logo"
            style={{ maxHeight: '48px', maxWidth: '200px', objectFit: 'contain' }}
          />
        ) : (
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 950,
            margin: 0,
            letterSpacing: '-0.05em',
            color: '#ffffff',
          }}>
            <span style={{ color: '#4f46e5' }}>S</span>utra<span style={{ color: '#4f46e5' }}>ID</span>
          </h1>
        )}
      </div>

      {/* Heading */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <p style={{ color: '#9ca3af', fontSize: '1.15rem', fontWeight: 500, margin: 0, letterSpacing: '-0.01em' }}>
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
                  <Link
                    href="/forgot-password"
                    style={{ fontSize: '0.8rem', color: accent, textDecoration: 'none', fontWeight: 500, marginBottom: '0.5rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    Forgot password?
                  </Link>
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
              width: '100%',
              padding: '1rem',
              background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(to right, #6366f1, #a855f7)',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              letterSpacing: '0.01em',
              boxShadow: loading ? 'none' : '0 8px 16px rgba(99, 102, 241, 0.2)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(99, 102, 241, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(99, 102, 241, 0.2)';
              }
            }}
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
          marginTop: '1.25rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '14px', color: '#fca5a5',
          fontSize: '0.9rem', textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* Mode toggle links */}
      {!mfaRequired && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          {mode === 'magic-link' && (
            <>
              <button
                type="button"
                onClick={() => switchMode('password')}
                style={{ background: 'none', border: 'none', color: cyanAccent, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', padding: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#22d3ee'}
                onMouseLeave={(e) => e.currentTarget.style.color = cyanAccent}
              >
                Sign in with password
              </button>
              {/* <div style={{ marginTop: '1rem' }}>
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Don&apos;t have an account? </span>
                <Link
                  href="/onboard"
                  style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', borderBottom: `1px solid ${cyanAccent}` }}
                >
                  Sign up
                </Link>
              </div> */}
            </>
          )}

          {mode === 'password' && (
            <>
              <button
                type="button"
                onClick={() => switchMode('magic-link')}
                style={{ background: 'none', border: 'none', color: cyanAccent, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', padding: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#22d3ee'}
                onMouseLeave={(e) => e.currentTarget.style.color = cyanAccent}
              >
                Sign in with magic link
              </button>
              {/* <div style={{ marginTop: '1rem' }}>
                <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Don&apos;t have an account? </span>
                <Link
                  href="/onboard"
                  style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', borderBottom: `1px solid ${cyanAccent}` }}
                >
                  Sign up
                </Link>
              </div> */}
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
