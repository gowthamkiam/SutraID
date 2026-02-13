'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface InteractionDetails {
  uid: string;
  application: {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
  };
  scopes: string[];
  redirectUri: string;
}

const scopeDescriptions: Record<string, { label: string; description: string }> = {
  openid: { label: 'OpenID', description: 'Verify your identity' },
  profile: { label: 'Profile', description: 'Access your name and basic profile info' },
  email: { label: 'Email', description: 'Access your email address' },
  offline_access: { label: 'Offline Access', description: 'Access your data while you are not logged in' },
};

function ConsentPageContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const orgId = searchParams.get('orgId');

  const [details, setDetails] = useState<InteractionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

  useEffect(() => {
    if (uid && orgId) {
      loadInteraction();
    } else {
      setError('Missing interaction parameters');
      setLoading(false);
    }
  }, [uid, orgId]);

  const loadInteraction = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        // Redirect to login
        window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.href)}`;
        return;
      }

      const response = await fetch(`${apiUrl}/sso/oidc-idp/${orgId}/interaction/${uid}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load interaction details');
      }

      const data = await response.json();
      setDetails(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConsent = async (consent: boolean) => {
    if (!uid || !orgId) return;
    setSubmitting(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`${apiUrl}/sso/oidc-idp/${orgId}/interaction/${uid}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ consent }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit consent');
      }

      const result = await response.json();
      if (result.redirectTo) {
        window.location.href = result.redirectTo;
      }
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary, #0f1419)', fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ width: '60px', height: '60px', border: '4px solid rgba(99, 102, 241, 0.1)', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !details) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary, #0f1419)', fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'var(--text-primary, #e6edf3)', padding: '2rem'
      }}>
        <div style={{
          background: 'var(--bg-card, #161b22)', border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px', padding: '2.5rem', maxWidth: '450px', width: '100%', textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#9888;&#65039;</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem' }}>Authorization Error</h1>
          <p style={{ color: '#fca5a5', fontSize: '0.9rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary, #0f1419)', fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'var(--text-primary, #e6edf3)', padding: '2rem'
    }}>
      <div style={{
        background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)',
        borderRadius: '16px', maxWidth: '450px', width: '100%', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '2rem 2rem 1.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-color, #30363d)' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '2rem'
          }}>
            {details?.application.logoUrl ? (
              <img src={details.application.logoUrl} alt="" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
            ) : '\uD83D\uDD10'}
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Authorize {details?.application.name}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #7d8590)', margin: 0 }}>
            This application wants to access your account
          </p>
        </div>

        {/* Scopes */}
        <div style={{ padding: '1.5rem 2rem' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              {error}
            </div>
          )}

          <p style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary, #7d8590)' }}>
            This application is requesting access to:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {details?.scopes.map((scope) => {
              const info = scopeDescriptions[scope] || { label: scope, description: `Access to ${scope}` };
              return (
                <div key={scope} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem', background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px', border: '1px solid var(--border-color, #30363d)'
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem', flexShrink: 0
                  }}>
                    &#10003;
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{info.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #7d8590)' }}>{info.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => handleConsent(false)}
              disabled={submitting}
              style={{
                flex: 1, padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary, #e6edf3)',
                border: '1px solid var(--border-color, #30363d)',
                borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem', fontWeight: '600', transition: 'all 0.2s'
              }}
            >
              Deny
            </button>
            <button
              onClick={() => handleConsent(true)}
              disabled={submitting}
              style={{
                flex: 1, padding: '0.75rem',
                background: submitting ? '#4b5563' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem', fontWeight: '600',
              }}
            >
              {submitting ? 'Processing...' : 'Allow'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 2rem', borderTop: '1px solid var(--border-color, #30363d)',
          textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary, #6e7681)'
        }}>
          Powered by SutraID
        </div>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense
      fallback={
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-primary, #0f1419)', fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ width: '60px', height: '60px', border: '4px solid rgba(99, 102, 241, 0.1)', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <ConsentPageContent />
    </Suspense>
  );
}
