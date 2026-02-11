'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Application {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
}

interface InteractionDetails {
  uid: string;
  application: Application;
  scopes: string[];
  redirectUri: string;
}

const scopeDescriptions: Record<string, string> = {
  openid: 'Verify your identity',
  profile: 'Access your basic profile information (name)',
  email: 'Access your email address',
  phone: 'Access your phone number',
  address: 'Access your address information',
  offline_access: 'Maintain access when you are offline',
};

export default function ConsentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');

  const [interaction, setInteraction] = useState<InteractionDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract orgId from the current URL or use a default
  // In production, this should come from the OAuth flow
  const [orgId, setOrgId] = useState<string>('');

  useEffect(() => {
    // Get orgId from localStorage or session
    const storedOrgId = localStorage.getItem('currentOrgId');
    if (storedOrgId) {
      setOrgId(storedOrgId);
    }
  }, []);

  useEffect(() => {
    if (!uid || !orgId) {
      return;
    }

    // Fetch interaction details
    const fetchInteraction = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/sso/oidc-idp/${orgId}/interaction/${uid}`,
          {
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error('Failed to fetch interaction details');
        }

        const data = await response.json();
        setInteraction(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load consent request');
      } finally {
        setLoading(false);
      }
    };

    fetchInteraction();
  }, [uid, orgId]);

  const handleConsent = async (consent: boolean) => {
    if (!uid || !orgId) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/sso/oidc-idp/${orgId}/interaction/${uid}/confirm`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({ consent }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to process consent');
      }

      const data = await response.json();

      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process consent');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-background)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Loading authorization request...
          </p>
        </div>
      </div>
    );
  }

  if (error || !interaction) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-background)',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            width: '100%',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '8px',
            padding: '32px',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'var(--color-error-light)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <span style={{ fontSize: '32px', color: 'var(--color-error)' }}>
              ✕
            </span>
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '12px',
            }}
          >
            Authorization Error
          </h1>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              marginBottom: '24px',
            }}
          >
            {error || 'Invalid or expired authorization request'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background)',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '32px 32px 24px',
            textAlign: 'center',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {interaction.application.logoUrl && (
            <img
              src={interaction.application.logoUrl}
              alt={interaction.application.name}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '12px',
                margin: '0 auto 16px',
                objectFit: 'cover',
              }}
            />
          )}
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '8px',
            }}
          >
            {interaction.application.name}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            wants to access your SutraID account
          </p>
        </div>

        {/* Permissions */}
        <div style={{ padding: '24px 32px' }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '16px',
            }}
          >
            This application will be able to:
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {interaction.scopes.map((scope) => (
              <li
                key={scope}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'var(--color-success-light)',
                    borderRadius: '50%',
                    marginRight: '12px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ color: 'var(--color-success)', fontSize: '12px' }}>
                    ✓
                  </span>
                </span>
                <div>
                  <div
                    style={{
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      fontSize: '14px',
                    }}
                  >
                    {scopeDescriptions[scope] || scope}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-tertiary)',
                      marginTop: '2px',
                    }}
                  >
                    {scope}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Security notice */}
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: 'var(--color-warning-light)',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <strong style={{ color: 'var(--color-warning)' }}>
              ⚠️ Security Notice
            </strong>
            <br />
            Only grant access if you trust this application. You can revoke
            access at any time from your account settings.
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '24px 32px 32px',
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            onClick={() => handleConsent(false)}
            disabled={submitting}
            style={{
              flex: 1,
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            Deny
          </button>
          <button
            onClick={() => handleConsent(true)}
            disabled={submitting}
            style={{
              flex: 1,
              padding: '12px 24px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Processing...' : 'Allow'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
