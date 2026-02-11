'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ssoApi, SsoProvider } from '@/lib/api';

export default function SsoProvidersPage() {
  const [providers, setProviders] = useState<SsoProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ providerId: string; success: boolean; checks: Array<{ name: string; passed: boolean; message: string }> } | null>(null);
  const router = useRouter();

  // For demo purposes, using a hardcoded orgId
  // In production, this would come from user context/session
  const orgId = 'org_demo_123';

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await ssoApi.listProviders(orgId);
      setProviders(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load SSO providers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this SSO provider?')) {
      return;
    }

    try {
      setDeleting(providerId);
      await ssoApi.deleteProvider(orgId, providerId);
      await loadProviders();
    } catch (err: any) {
      alert('Failed to delete provider: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleTest = async (providerId: string) => {
    try {
      setTesting(providerId);
      setTestResult(null);
      const result = await ssoApi.testConnection(orgId, providerId);
      setTestResult({ providerId, ...result });
    } catch (err: any) {
      setTestResult({
        providerId,
        success: false,
        checks: [{ name: 'Connection', passed: false, message: err.message || 'Test failed' }],
      });
    } finally {
      setTesting(null);
    }
  };

  const handleToggle = async (provider: SsoProvider) => {
    try {
      await ssoApi.updateProvider(orgId, provider.id, {
        enabled: !provider.enabled,
      });
      await loadProviders();
    } catch (err: any) {
      alert('Failed to toggle provider: ' + err.message);
    }
  };

  const getProtocolBadgeColor = (protocol: string) => {
    return protocol === 'SAML2' ? '#3b82f6' : '#10b981';
  };

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      OKTA: '#0066ff',
      AZURE_AD: '#00a4ef',
      GOOGLE_WORKSPACE: '#ea4335',
      GENERIC_SAML: '#6b7280',
      GENERIC_OIDC: '#6b7280',
    };
    return colors[type] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #000',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
            <p style={{ marginTop: '1rem', color: '#666' }}>Loading SSO providers...</p>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#666'
              }}
            >
              ←
            </button>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              🔐 SSO Providers
            </h1>
          </div>
          <button
            onClick={() => router.push('/dashboard/sso/providers/new')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}
          >
            + Add SSO Provider
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {error && (
          <div style={{
            background: '#fee',
            color: '#c00',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}

        {providers.length === 0 ? (
          <div style={{
            background: '#fff',
            padding: '4rem 2rem',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              No SSO Providers Yet
            </h2>
            <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
              Add your first SSO provider to enable enterprise authentication with SAML or OIDC.
            </p>
            <button
              onClick={() => router.push('/dashboard/sso/providers/new')}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              + Add SSO Provider
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {providers.map((provider) => (
              <div
                key={provider.id}
                style={{
                  background: '#fff',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '1.5rem',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                      {provider.name}
                    </h3>
                    <span
                      style={{
                        background: getProtocolBadgeColor(provider.protocol),
                        color: '#fff',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      {provider.protocol}
                    </span>
                    <span
                      style={{
                        background: getTypeBadgeColor(provider.type),
                        color: '#fff',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      {provider.type.replace(/_/g, ' ')}
                    </span>
                    <span
                      style={{
                        background: provider.enabled ? '#d4edda' : '#f8d7da',
                        color: provider.enabled ? '#155724' : '#721c24',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                    >
                      {provider.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>

                  <div style={{ color: '#666', fontSize: '0.9rem', display: 'grid', gap: '0.5rem' }}>
                    {provider.protocol === 'SAML2' && provider.samlEntityId && (
                      <div>
                        <span style={{ fontWeight: '500' }}>Entity ID:</span> {provider.samlEntityId}
                      </div>
                    )}
                    {provider.protocol === 'SAML2' && provider.samlSsoUrl && (
                      <div>
                        <span style={{ fontWeight: '500' }}>SSO URL:</span> {provider.samlSsoUrl}
                      </div>
                    )}
                    {provider.protocol === 'OIDC' && provider.oidcIssuer && (
                      <div>
                        <span style={{ fontWeight: '500' }}>Issuer:</span> {provider.oidcIssuer}
                      </div>
                    )}
                    {provider.protocol === 'OIDC' && provider.oidcClientId && (
                      <div>
                        <span style={{ fontWeight: '500' }}>Client ID:</span> {provider.oidcClientId}
                      </div>
                    )}
                    {provider.allowedDomains.length > 0 && (
                      <div>
                        <span style={{ fontWeight: '500' }}>Allowed Domains:</span> {provider.allowedDomains.join(', ')}
                      </div>
                    )}
                    <div>
                      <span style={{ fontWeight: '500' }}>Auto Provision:</span> {provider.autoProvision ? 'Yes' : 'No'}
                    </div>
                  </div>

                  {provider.protocol === 'SAML2' && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem', color: '#666' }}>
                        SAML Metadata URL (share with IdP):
                      </div>
                      <code style={{
                        display: 'block',
                        padding: '0.5rem',
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                      }}>
                        {ssoApi.getSamlMetadataUrl(orgId)}
                      </code>
                    </div>
                  )}

                  {/* Test Results */}
                  {testResult && testResult.providerId === provider.id && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: testResult.success ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
                      borderRadius: '6px'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        marginBottom: '0.5rem',
                        color: testResult.success ? '#166534' : '#991b1b'
                      }}>
                        {testResult.success ? 'All checks passed' : 'Some checks failed'}
                      </div>
                      {testResult.checks.map((check, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.85rem',
                          color: '#374151',
                          marginTop: '0.25rem'
                        }}>
                          <span style={{ color: check.passed ? '#16a34a' : '#dc2626' }}>
                            {check.passed ? '\u2713' : '\u2717'}
                          </span>
                          <span style={{ fontWeight: '500' }}>{check.name}:</span>
                          <span>{check.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => handleToggle(provider)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: provider.enabled ? '#fff' : '#000',
                      color: provider.enabled ? '#000' : '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      minWidth: '100px'
                    }}
                  >
                    {provider.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/sso/providers/${provider.id}/edit`)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#fff',
                      color: '#000',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      minWidth: '100px'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleTest(provider.id)}
                    disabled={testing === provider.id}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#fff',
                      color: '#2563eb',
                      border: '1px solid #2563eb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      minWidth: '100px',
                      opacity: testing === provider.id ? 0.5 : 1
                    }}
                  >
                    {testing === provider.id ? 'Testing...' : 'Test'}
                  </button>
                  <button
                    onClick={() => handleDelete(provider.id)}
                    disabled={deleting === provider.id}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#fff',
                      color: '#dc2626',
                      border: '1px solid #dc2626',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      minWidth: '100px',
                      opacity: deleting === provider.id ? 0.5 : 1
                    }}
                  >
                    {deleting === provider.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
