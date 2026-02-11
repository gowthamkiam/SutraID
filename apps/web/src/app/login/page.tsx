'use client';

import { useState, useEffect, useRef } from 'react';
import { ssoApi } from '@/lib/api';

interface SsoProviderInfo {
  id: string;
  name: string;
  type: string;
  protocol: string;
  organizationId: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${apiUrl}/auth/magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send magic link');
      }

      setMessage(data.message || 'Magic link sent! Check your email.');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      background: '#f9fafb'
    }}>
      <div style={{
        background: '#fff',
        padding: '3rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            SutraID
          </h1>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Sign in with your email
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              fontSize: '0.9rem'
            }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#000'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          {/* SSO Provider Buttons */}
          {ssoLoading && (
            <div style={{
              textAlign: 'center',
              padding: '0.75rem',
              color: '#666',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              Checking for SSO providers...
            </div>
          )}

          {ssoProviders.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: '500' }}>
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
                      padding: '0.75rem',
                      background: '#fff',
                      color: '#000',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.borderColor = '#000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.borderColor = '#ddd';
                    }}
                  >
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      background: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: '#374151'
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
                margin: '1rem 0'
              }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                <span style={{ color: '#999', fontSize: '0.8rem' }}>or use magic link</span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#999' : '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '6px',
            color: '#155724',
            fontSize: '0.9rem'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            color: '#721c24',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <div style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #eee',
          textAlign: 'center'
        }}>
          <p style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            We'll send you a secure link to sign in
          </p>
          <p style={{ color: '#999', fontSize: '0.8rem' }}>
            No password needed. Link expires in 15 minutes.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <a
          href="/"
          style={{
            color: '#666',
            fontSize: '0.9rem',
            textDecoration: 'none'
          }}
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
