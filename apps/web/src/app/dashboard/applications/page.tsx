'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { applicationApi, Application, OrgRole } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { hasPermission } from '@/lib/permissions';

export default function ApplicationsPage() {
  const { role: orgRole, loading: orgLoading } = useAuth();
  const canCreate = hasPermission(orgRole as OrgRole, 'apps:create');
  const canDelete = hasPermission(orgRole as OrgRole, 'apps:delete');

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      const data = await applicationApi.list();
      setApps(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = (app: Application) => {
    if (!app.clientId) return;

    // Generate a simple PKCE verifier/challenge for the quick test
    // In a real app, this would be more robust.
    const verifier = 'quick-test-verifier-123456789012345678901234567890';
    const challenge = 'S1FQX1Rlc3RfQ2hhbGxlbmdlXzEyMzQ1Njc4OTAxMjM0NTY3ODk'; // Placeholder S256 challenge

    const params = new URLSearchParams({
      client_id: app.clientId,
      response_type: 'code',
      scope: 'openid profile email',
      redirect_uri: app.redirectUris[0] || window.location.origin + '/auth/callback',
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    const authorizeUrl = `${applicationApi.getAuthorizeUrl(app.id)}?${params.toString()}`;
    window.open(authorizeUrl, '_blank');
  };

  const handleDelete = async (appId: string) => {
    if (!canDelete) {
      alert('You do not have permission to delete applications');
      return;
    }
    if (!confirm('Are you sure you want to archive this application?')) return;
    try {
      await applicationApi.remove(appId);
      await loadApps();
    } catch (err: any) {
      alert('Failed to delete application: ' + err.message);
    }
  };

  const filteredApps = apps.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.type.toLowerCase().includes(searchQuery.toLowerCase())
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
              width: '60px', height: '60px',
              border: '4px solid rgba(99, 102, 241, 0.1)',
              borderTop: '4px solid #6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary, #7d8590)' }}>Loading applications...</p>
          </div>
        </div>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
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
        position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push(`/dashboard`)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color, #30363d)',
                borderRadius: '8px', padding: '0.5rem 0.75rem',
                cursor: 'pointer', fontSize: '1.1rem',
                color: 'var(--text-secondary, #7d8590)', transition: 'all 0.2s'
              }}
            >
              &#8592;
            </button>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Applications</span>
              </h1>
              <p style={{ color: 'var(--text-secondary, #7d8590)', margin: 0, fontSize: '0.9rem' }}>
                Manage OAuth 2.1 (OIDC) and SAML 2.0 Identity Provider applications
              </p>
            </div>
          </div>
          <button
            onClick={() => canCreate && router.push(`/dashboard/applications/new`)}
            disabled={!canCreate}
            title={!canCreate ? 'Read-only administrators cannot create applications' : ''}
            style={{
              padding: '0.75rem 1.5rem',
              background: canCreate ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#6b7280',
              color: '#fff', border: 'none', borderRadius: '8px',
              cursor: canCreate ? 'pointer' : 'not-allowed', fontSize: '0.95rem', fontWeight: '600',
              boxShadow: canCreate ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              opacity: canCreate ? 1 : 0.5,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => { if (canCreate) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { if (canCreate) e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            + New Application
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5',
            padding: '1rem 1.5rem', borderRadius: '8px', marginBottom: '1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}>
            <span>{error}</span>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: '2rem', maxWidth: '500px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem',
                background: 'var(--bg-card, #161b22)',
                border: '1px solid var(--border-color, #30363d)',
                borderRadius: '8px', color: 'var(--text-primary, #e6edf3)',
                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6366f1'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color, #30363d)'; }}
            />
            <span style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
              fontSize: '1.1rem', color: 'var(--text-tertiary, #6e7681)'
            }}>
              &#128269;
            </span>
          </div>
        </div>

        {/* Empty State */}
        {filteredApps.length === 0 && !searchQuery && (
          <div style={{
            background: 'var(--bg-card, #161b22)', padding: '4rem 2rem', borderRadius: '12px',
            textAlign: 'center', border: '1px solid var(--border-color, #30363d)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>&#128241;</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: '700' }}>No Applications Yet</h2>
            <p style={{
              color: 'var(--text-secondary, #7d8590)', marginBottom: '2rem',
              maxWidth: '500px', margin: '0 auto 2rem', fontSize: '1rem', lineHeight: '1.6'
            }}>
              Create your first application to enable OAuth 2.1 (OIDC) or SAML 2.0 Identity Provider features.
            </p>
            <button
              onClick={() => canCreate && router.push(`/dashboard/applications/new`)}
              disabled={!canCreate}
              title={!canCreate ? 'Read-only administrators cannot create applications' : ''}
              style={{
                padding: '0.75rem 2rem',
                background: canCreate ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#6b7280',
                color: '#fff', border: 'none', borderRadius: '8px',
                cursor: canCreate ? 'pointer' : 'not-allowed',
                fontSize: '1rem', fontWeight: '600',
                boxShadow: canCreate ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
                opacity: canCreate ? 1 : 0.5
              }}
            >
              + Create Your First Application
            </button>
          </div>
        )}

        {/* Applications Grid */}
        {filteredApps.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem'
          }}>
            {filteredApps.map((app) => (
              <div
                key={app.id}
                onClick={() => router.push(`/dashboard/applications/${app.id}`)}
                style={{
                  background: 'var(--bg-card, #161b22)', padding: '1.5rem', borderRadius: '12px',
                  border: '1px solid var(--border-color, #30363d)', transition: 'all 0.2s', cursor: 'pointer'
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
                    width: '48px', height: '48px', borderRadius: '10px',
                    background: app.type === 'OIDC' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
                  }}>
                    {app.type === 'OIDC' ? '\uD83D\uDD11' : '\uD83D\uDD10'}
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600',
                    background: app.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(125, 133, 144, 0.15)',
                    color: app.status === 'ACTIVE' ? '#10b981' : 'var(--text-secondary, #7d8590)'
                  }}>
                    {app.status === 'ACTIVE' ? '\u25CF Active' : '\u25CB ' + app.status}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '0.5rem' }}>{app.name}</h3>
                {app.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                    {app.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <span style={{
                    background: app.type === 'OIDC' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: app.type === 'OIDC' ? '#a78bfa' : '#60a5fa',
                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600'
                  }}>
                    {app.type === 'OIDC' ? 'OAuth 2.1 / OIDC' : 'SAML 2.0'}
                  </span>
                  {app.requireDpop && (
                    <span style={{
                      background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24',
                      padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600'
                    }}>
                      DPoP
                    </span>
                  )}
                  {app.isAiAgent && (
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
                      padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600'
                    }}>
                      AI Agent
                    </span>
                  )}
                  {app.isPublicClient && (
                    <span style={{
                      background: 'rgba(251, 146, 60, 0.15)', color: '#fb923c',
                      padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600'
                    }}>
                      Public
                    </span>
                  )}
                </div>

                {app.clientId && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary, #6e7681)', marginBottom: '1rem' }}>
                    Client ID: <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{app.clientId.substring(0, 20)}...</code>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/applications/${app.id}`); }}
                    style={{
                      padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-primary, #e6edf3)',
                      border: '1px solid var(--border-color, #30363d)', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', transition: 'all 0.2s'
                    }}
                  >
                    Configure
                  </button>
                  {app.type === 'OIDC' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuickTest(app); }}
                      style={{
                        padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)',
                        color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500', transition: 'all 0.2s'
                      }}
                    >
                      Quick Test
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); canDelete && handleDelete(app.id); }}
                    disabled={!canDelete}
                    title={!canDelete ? 'You do not have permission to delete applications' : ''}
                    style={{
                      padding: '0.5rem',
                      background: canDelete ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                      color: canDelete ? '#fca5a5' : '#9ca3af',
                      border: canDelete ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)',
                      borderRadius: '6px',
                      cursor: canDelete ? 'pointer' : 'not-allowed',
                      fontSize: '0.85rem', fontWeight: '500', transition: 'all 0.2s',
                      gridColumn: app.type === 'OIDC' ? 'span 2' : 'auto',
                      opacity: canDelete ? 1 : 0.5
                    }}
                  >
                    Archive
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
