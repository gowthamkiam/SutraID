'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ssoApi, SsoProvider } from '@/lib/api';

type ViewMode = 'grid' | 'list';

interface ProviderTemplate {
  type: string;
  name: string;
  description: string;
  icon: string;
  protocol: 'SAML2' | 'OIDC';
  color: string;
}

const providerTemplates: ProviderTemplate[] = [
  {
    type: 'OKTA',
    name: 'Okta',
    description: 'Enterprise identity management and SSO platform',
    icon: '🔷',
    protocol: 'SAML2',
    color: '#007dc1',
  },
  {
    type: 'AZURE_AD',
    name: 'Azure AD',
    description: 'Microsoft Azure Active Directory SSO integration',
    icon: '🔷',
    protocol: 'OIDC',
    color: '#0078d4',
  },
  {
    type: 'GOOGLE_WORKSPACE',
    name: 'Google Workspace',
    description: 'Google Workspace (G Suite) SSO integration',
    icon: '🔴',
    protocol: 'SAML2',
    color: '#ea4335',
  },
  {
    type: 'GENERIC_SAML',
    name: 'Generic SAML 2.0',
    description: 'Connect any SAML 2.0 compliant identity provider',
    icon: '🔐',
    protocol: 'SAML2',
    color: '#6366f1',
  },
  {
    type: 'GENERIC_OIDC',
    name: 'Generic OIDC',
    description: 'Connect any OpenID Connect compatible provider',
    icon: '🔑',
    protocol: 'OIDC',
    color: '#8b5cf6',
  },
];

export default function SsoProvidersPage() {
  const [providers, setProviders] = useState<SsoProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ providerId: string; success: boolean; checks: Array<{ name: string; passed: boolean; message: string }> } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const router = useRouter();

  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('currentOrgId');
    if (stored) {
      setOrgId(stored);
    } else {
      // Fetch user's first org
      const accessToken = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      fetch(`${apiUrl}/organizations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((orgs) => {
          if (orgs.length > 0) {
            setOrgId(orgs[0].id);
            localStorage.setItem('currentOrgId', orgs[0].id);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (orgId) loadProviders();
  }, [orgId]);

  const loadProviders = async () => {
    if (!orgId) return;
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

    if (!orgId) return;
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
    if (!orgId) return;
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
    if (!orgId) return;
    try {
      await ssoApi.updateProvider(orgId, provider.id, {
        enabled: !provider.enabled,
      });
      await loadProviders();
    } catch (err: any) {
      alert('Failed to toggle provider: ' + err.message);
    }
  };

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'var(--bg-primary, #0f1419)',
        color: 'var(--text-primary, #e6edf3)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(99, 102, 241, 0.1)',
              borderTop: '4px solid #6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary, #7d8590)' }}>Loading SSO providers...</p>
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
    <div style={{
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'var(--bg-primary, #0f1419)',
      color: 'var(--text-primary, #e6edf3)'
    }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-card, #161b22)',
        borderBottom: '1px solid var(--border-color, #30363d)',
        padding: '1.25rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color, #30363d)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                fontSize: '1.1rem',
                color: 'var(--text-secondary, #7d8590)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              ←
            </button>
            <div>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                margin: '0 0 0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>🔐</span>
                <span>SSO Connections</span>
              </h1>
              <p style={{ color: 'var(--text-secondary, #7d8590)', margin: 0, fontSize: '0.9rem' }}>
                Manage SAML and OIDC identity provider integrations
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowTemplates(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
            }}
          >
            + Add Connection
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#fca5a5',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Search and View Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '300px', maxWidth: '500px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search connections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  background: 'var(--bg-card, #161b22)',
                  border: '1px solid var(--border-color, #30363d)',
                  borderRadius: '8px',
                  color: 'var(--text-primary, #e6edf3)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color, #30363d)';
                }}
              />
              <span style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.1rem',
                color: 'var(--text-tertiary, #6e7681)'
              }}>
                🔍
              </span>
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '0.25rem'
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                color: viewMode === 'grid' ? '#a5b4fc' : 'var(--text-secondary, #7d8590)',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              ⊞ Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                color: viewMode === 'list' ? '#a5b4fc' : 'var(--text-secondary, #7d8590)',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              ☰ List
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredProviders.length === 0 && !searchQuery && (
          <div style={{
            background: 'var(--bg-card, #161b22)',
            padding: '4rem 2rem',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid var(--border-color, #30363d)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
            <h2 style={{
              fontSize: '1.5rem',
              marginBottom: '0.75rem',
              fontWeight: '700'
            }}>
              No SSO Connections Yet
            </h2>
            <p style={{
              color: 'var(--text-secondary, #7d8590)',
              marginBottom: '2rem',
              maxWidth: '500px',
              margin: '0 auto 2rem',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Connect your organization's identity provider to enable enterprise SSO authentication with SAML 2.0 or OpenID Connect.
            </p>
            <button
              onClick={() => setShowTemplates(true)}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              + Add Your First Connection
            </button>
          </div>
        )}

        {/* No Search Results */}
        {filteredProviders.length === 0 && searchQuery && (
          <div style={{
            background: 'var(--bg-card, #161b22)',
            padding: '3rem 2rem',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid var(--border-color, #30363d)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: '600' }}>
              No connections found
            </h2>
            <p style={{ color: 'var(--text-secondary, #7d8590)' }}>
              Try adjusting your search query
            </p>
          </div>
        )}

        {/* Providers Grid View */}
        {filteredProviders.length > 0 && viewMode === 'grid' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem'
          }}>
            {filteredProviders.map((provider) => (
              <div
                key={provider.id}
                style={{
                  background: 'var(--bg-card, #161b22)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #30363d)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color, #30363d)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: provider.type === 'OKTA' ? '#007dc1' :
                      provider.type === 'AZURE_AD' ? '#0078d4' :
                      provider.type === 'GOOGLE_WORKSPACE' ? '#ea4335' : 'rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    {provider.type === 'OKTA' ? '🔷' :
                     provider.type === 'AZURE_AD' ? '🔷' :
                     provider.type === 'GOOGLE_WORKSPACE' ? '🔴' :
                     provider.protocol === 'SAML2' ? '🔐' : '🔑'}
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: provider.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(125, 133, 144, 0.15)',
                    color: provider.enabled ? '#10b981' : 'var(--text-secondary, #7d8590)'
                  }}>
                    {provider.enabled ? '● Active' : '○ Inactive'}
                  </div>
                </div>

                <h3 style={{
                  fontSize: '1.15rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  {provider.name}
                </h3>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: provider.protocol === 'SAML2' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: provider.protocol === 'SAML2' ? '#60a5fa' : '#34d399',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {provider.protocol}
                  </span>
                  <span style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: '#a78bfa',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {provider.type.replace(/_/g, ' ')}
                  </span>
                </div>

                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary, #7d8590)',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {provider.protocol === 'SAML2' && provider.samlEntityId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ opacity: 0.7 }}>🆔</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {provider.samlEntityId}
                      </span>
                    </div>
                  )}
                  {provider.protocol === 'OIDC' && provider.oidcIssuer && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ opacity: 0.7 }}>🌐</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {provider.oidcIssuer}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/sso/providers/${provider.id}/edit`);
                    }}
                    style={{
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary, #e6edf3)',
                      border: '1px solid var(--border-color, #30363d)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    ⚙️ Configure
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(provider);
                    }}
                    style={{
                      padding: '0.5rem',
                      background: provider.enabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: provider.enabled ? '#fca5a5' : '#34d399',
                      border: `1px solid ${provider.enabled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {provider.enabled ? '○ Disable' : '● Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Providers List View */}
        {filteredProviders.length > 0 && viewMode === 'list' && (
          <div style={{
            background: 'var(--bg-card, #161b22)',
            border: '1px solid var(--border-color, #30363d)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {filteredProviders.map((provider, index) => (
              <div
                key={provider.id}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: index < filteredProviders.length - 1 ? '1px solid var(--border-color, #30363d)' : 'none',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '1.5rem',
                  alignItems: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: provider.type === 'OKTA' ? '#007dc1' :
                    provider.type === 'AZURE_AD' ? '#0078d4' :
                    provider.type === 'GOOGLE_WORKSPACE' ? '#ea4335' : 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0
                }}>
                  {provider.type === 'OKTA' ? '🔷' :
                   provider.type === 'AZURE_AD' ? '🔷' :
                   provider.type === 'GOOGLE_WORKSPACE' ? '🔴' :
                   provider.protocol === 'SAML2' ? '🔐' : '🔑'}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>
                      {provider.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: provider.protocol === 'SAML2' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: provider.protocol === 'SAML2' ? '#60a5fa' : '#34d399',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {provider.protocol}
                      </span>
                      <span style={{
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#a78bfa',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {provider.type.replace(/_/g, ' ')}
                      </span>
                      <span style={{
                        background: provider.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(125, 133, 144, 0.15)',
                        color: provider.enabled ? '#10b981' : 'var(--text-secondary, #7d8590)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {provider.enabled ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)' }}>
                    {provider.protocol === 'SAML2' && provider.samlEntityId && (
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🆔 {provider.samlEntityId}
                      </div>
                    )}
                    {provider.protocol === 'OIDC' && provider.oidcIssuer && (
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🌐 {provider.oidcIssuer}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => router.push(`/dashboard/sso/providers/${provider.id}/edit`)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary, #e6edf3)',
                      border: '1px solid var(--border-color, #30363d)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    Configure
                  </button>
                  <button
                    onClick={() => handleToggle(provider)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: provider.enabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: provider.enabled ? '#fca5a5' : '#34d399',
                      border: `1px solid ${provider.enabled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {provider.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Templates Modal */}
      {showTemplates && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}
        onClick={() => setShowTemplates(false)}
        >
          <div style={{
            background: 'var(--bg-card, #161b22)',
            borderRadius: '16px',
            maxWidth: '1000px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid var(--border-color, #30363d)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '2rem',
              borderBottom: '1px solid var(--border-color, #30363d)',
              position: 'sticky',
              top: 0,
              background: 'var(--bg-card, #161b22)',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                    Choose a Connection Type
                  </h2>
                  <p style={{ color: 'var(--text-secondary, #7d8590)', margin: 0 }}>
                    Select your identity provider to get started
                  </p>
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    color: 'var(--text-secondary, #7d8590)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.25rem'
              }}>
                {providerTemplates.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => {
                      setShowTemplates(false);
                      router.push(`/dashboard/sso/providers/new?type=${template.type}`);
                    }}
                    style={{
                      background: 'var(--bg-primary, #0f1419)',
                      border: '1px solid var(--border-color, #30363d)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = template.color;
                      e.currentTarget.style.boxShadow = `0 4px 12px ${template.color}25`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color, #30363d)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: template.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      marginBottom: '1rem'
                    }}>
                      {template.icon}
                    </div>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      color: 'var(--text-primary, #e6edf3)'
                    }}>
                      {template.name}
                    </h3>
                    <p style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary, #7d8590)',
                      lineHeight: '1.5',
                      marginBottom: '0.75rem'
                    }}>
                      {template.description}
                    </p>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: template.protocol === 'SAML2' ? '#60a5fa' : '#34d399',
                      background: template.protocol === 'SAML2' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {template.protocol}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
