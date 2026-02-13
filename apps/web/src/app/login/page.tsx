'use client';

import { useState, useEffect, useRef } from 'react';
import { ssoApi } from '@/lib/api';

type AuthMode = 'magic-link' | 'password' | 'register';

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

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('magic-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ssoProviders, setSsoProviders] = useState<SsoProviderInfo[]>([]);
  const [ssoLoading, setSsoLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const getProviderIcon = (type: string) => {
    const icons: Record<string, string> = {
      OKTA: 'O',
      AZURE_AD: 'M',
      GOOGLE_WORKSPACE: 'G',
      GENERIC_SAML: 'S',
      GENERIC_OIDC: 'C',
    };
    return icons[type] || 'S';
  };

  const getProviderLabel = (type: string) => {
    const labels: Record<string, string> = {
      OKTA: 'Okta',
      AZURE_AD: 'Microsoft',
      GOOGLE_WORKSPACE: 'Google',
      GENERIC_SAML: 'SAML SSO',
      GENERIC_OIDC: 'OIDC SSO',
    };
    return labels[type] || 'SSO';
  };

  // Debounced SSO discovery when email domain changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

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
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
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
    setConfirmPassword('');
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
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Invalid email or password');
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
        return;
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        const response = await fetch(`${apiUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Registration failed');
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getHeading = () => {
    if (mode === 'register') return 'Create your account';
    return 'Welcome back !';
  };

  const getButtonLabel = () => {
    if (loading) {
      if (mode === 'magic-link') return 'Sending...';
      if (mode === 'register') return 'Creating account...';
      return 'Signing in...';
    }
    if (mode === 'magic-link') return 'Send Magic Link';
    if (mode === 'register') return 'Create Account';
    return 'Sign In';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      padding: '2rem',
      background: 'linear-gradient(160deg, #0a1628 0%, #0f2035 25%, #0d2847 50%, #0a2a3c 75%, #0e1f2f 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Card */}
      <div style={{
        background: '#ffffff',
        padding: '3rem 2.5rem',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        maxWidth: '440px',
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.5px',
            color: '#111827',
          }}>
            <span style={{ color: '#4f46e5' }}>S</span>utra
            <span style={{ color: '#4f46e5' }}>ID</span>
          </h1>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{
            color: '#374151',
            fontSize: '1.1rem',
            fontWeight: 500,
            margin: 0,
          }}>
            {getHeading()}
          </p>
        </div>

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

          {/* Password field (password & register modes) */}
          {(mode === 'password' || mode === 'register') && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                {mode === 'password' && (
                  <a
                    href="/forgot-password"
                    style={{
                      fontSize: '0.8rem',
                      color: '#4f46e5',
                      textDecoration: 'none',
                      fontWeight: 500,
                      marginBottom: '0.5rem',
                    }}
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
                placeholder={mode === 'register' ? 'Min. 8 characters' : 'Enter your password'}
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          )}

          {/* Confirm Password (register mode) */}
          {mode === 'register' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>
          )}

          {/* SSO Provider Buttons (only in magic-link mode) */}
          {mode === 'magic-link' && ssoLoading && (
            <div style={{
              textAlign: 'center',
              padding: '0.75rem',
              color: '#6b7280',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}>
              Checking for SSO providers...
            </div>
          )}

          {mode === 'magic-link' && ssoProviders.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                <span style={{ color: '#6b7280', fontSize: '0.8rem', fontWeight: 500 }}>
                  SSO available for your domain
                </span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              </div>

              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {ssoProviders.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleSsoLogin(provider)}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      background: '#fff',
                      color: '#374151',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '50px',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#4f46e5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  >
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#4f46e5',
                    }}>
                      {getProviderIcon(provider.type)}
                    </span>
                    Sign in with {provider.name || getProviderLabel(provider.type)}
                  </button>
                ))}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                margin: '1rem 0',
              }}>
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
              padding: '0.9rem',
              background: loading ? '#9ca3af' : '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s, transform 0.1s',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#4338ca';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#4f46e5';
            }}
          >
            {getButtonLabel()}
          </button>
        </form>

        {/* Status messages */}
        {message && (
          <div style={{
            marginTop: '1.25rem',
            padding: '1rem',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            color: '#065f46',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            marginTop: '1.25rem',
            padding: '1rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#991b1b',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Mode toggle links */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          {mode === 'magic-link' && (
            <>
              <button
                type="button"
                onClick={() => switchMode('password')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Sign in with password
              </button>
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4f46e5',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Sign up
                </button>
              </div>
            </>
          )}

          {mode === 'password' && (
            <>
              <button
                type="button"
                onClick={() => switchMode('magic-link')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Sign in with magic link
              </button>
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4f46e5',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Sign up
                </button>
              </div>
            </>
          )}

          {mode === 'register' && (
            <>
              <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Already have an account? </span>
              <button
                type="button"
                onClick={() => switchMode('magic-link')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bottom-right helper tooltip */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '0.75rem',
        zIndex: 10,
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px 16px 4px 16px',
          padding: '0.875rem 1.25rem',
          maxWidth: '280px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          fontSize: '0.875rem',
          color: '#374151',
          fontWeight: 500,
          lineHeight: 1.4,
        }}>
          Forgot your password? Good. You do not need it
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
        }}>
          🔐
        </div>
      </div>
    </div>
  );
}
