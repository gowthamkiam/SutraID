'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Application {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  clientId: string;
  type: 'WEB' | 'SPA' | 'NATIVE_MOBILE' | 'M2M';
  status: 'ACTIVE' | 'INACTIVE';
  redirectUris: string[];
  allowedOrigins: string[];
  samlIdpEnabled: boolean;
  oidcIdpEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

type ViewMode = 'grid' | 'list';

const appTypeLabels: Record<string, string> = {
  WEB: 'Web Application',
  SPA: 'Single Page App',
  NATIVE_MOBILE: 'Native Mobile',
  M2M: 'Machine to Machine',
};

const appTypeIcons: Record<string, string> = {
  WEB: '🌐',
  SPA: '⚡',
  NATIVE_MOBILE: '📱',
  M2M: '🤖',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${apiUrl}/applications`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load applications');
      }

      const data = await response.json();
      setApplications(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(appId);
      const accessToken = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${apiUrl}/applications/${appId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete application');
      }

      await loadApplications();
    } catch (err: any) {
      alert('Failed to delete application: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const filteredApplications = applications.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0f1419)', color: 'var(--text-primary, #e6edf3)', padding: '2rem' }}>
      {/* Header */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
                Applications
              </h1>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary, #8b949e)' }}>
                Manage applications that use SutraID for authentication
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/applications/new')}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>+</span>
              <span>New Application</span>
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1', minWidth: '300px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #8b949e)', fontSize: '1.1rem' }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card, #161b22)',
                border: '1px solid var(--border-color, #30363d)',
                borderRadius: '8px',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                color: 'var(--text-primary, #e6edf3)',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color, #30363d)'}
            />
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '8px', padding: '0.25rem' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: viewMode === 'grid' ? '#6366f1' : 'var(--text-secondary, #8b949e)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: viewMode === 'list' ? '#6366f1' : 'var(--text-secondary, #8b949e)',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
            >
              List
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary, #8b949e)' }}>
            <p>Loading applications...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredApplications.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card, #161b22)', borderRadius: '12px', border: '1px solid var(--border-color, #30363d)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
              {searchQuery ? 'No applications found' : 'No applications yet'}
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '1.5rem' }}>
              {searchQuery ? 'Try a different search term' : 'Create your first application to get started with SutraID'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/dashboard/applications/new')}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Create Application
              </button>
            )}
          </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === 'grid' && filteredApplications.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                style={{
                  background: 'var(--bg-card, #161b22)',
                  border: '1px solid var(--border-color, #30363d)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color, #30363d)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => router.push(`/dashboard/applications/${app.id}`)}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: app.logoUrl ? `url(${app.logoUrl})` : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0,
                  }}>
                    {!app.logoUrl && appTypeIcons[app.type]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--text-primary, #e6edf3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {app.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #8b949e)', margin: 0 }}>
                      {appTypeLabels[app.type]}
                    </p>
                  </div>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: app.status === 'ACTIVE' ? '#10b981' : '#6b7280',
                      flexShrink: 0,
                    }}
                    title={app.status}
                  />
                </div>

                {/* Description */}
                {app.description && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '1rem', lineHeight: '1.5', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {app.description}
                  </p>
                )}

                {/* Client ID */}
                <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '0.25rem' }}>Client ID</div>
                  <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#6366f1', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {app.clientId}
                  </div>
                </div>

                {/* Features */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {app.samlIdpEnabled && (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '0.25rem 0.625rem', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                      SAML
                    </span>
                  )}
                  {app.oidcIdpEnabled && (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee', padding: '0.25rem 0.625rem', borderRadius: '4px', border: '1px solid rgba(34, 211, 238, 0.3)' }}>
                      OIDC
                    </span>
                  )}
                  {!app.samlIdpEnabled && !app.oidcIdpEnabled && (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', padding: '0.25rem 0.625rem', borderRadius: '4px', border: '1px solid rgba(107, 114, 128, 0.3)' }}>
                      Not configured
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color, #30363d)' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/applications/${app.id}`);
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                    }}
                  >
                    Configure
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(app.id);
                    }}
                    disabled={deleting === app.id}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.85rem',
                      cursor: deleting === app.id ? 'not-allowed' : 'pointer',
                      opacity: deleting === app.id ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (deleting !== app.id) {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                  >
                    {deleting === app.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && filteredApplications.length > 0 && (
          <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(99, 102, 241, 0.05)', borderBottom: '1px solid var(--border-color, #30363d)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary, #8b949e)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Application
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary, #8b949e)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Type
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary, #8b949e)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Client ID
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary, #8b949e)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Features
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary, #8b949e)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Status
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary, #8b949e)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app, index) => (
                  <tr
                    key={app.id}
                    style={{
                      borderBottom: index < filteredApplications.length - 1 ? '1px solid var(--border-color, #30363d)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    onClick={() => router.push(`/dashboard/applications/${app.id}`)}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: app.logoUrl ? `url(${app.logoUrl})` : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem',
                          flexShrink: 0,
                        }}>
                          {!app.logoUrl && appTypeIcons[app.type]}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary, #e6edf3)', marginBottom: '0.125rem' }}>
                            {app.name}
                          </div>
                          {app.description && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #8b949e)' }}>
                              {app.description.length > 50 ? app.description.substring(0, 50) + '...' : app.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #8b949e)' }}>
                        {appTypeLabels[app.type]}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <code style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {app.clientId}
                      </code>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {app.samlIdpEnabled && (
                          <span style={{ fontSize: '0.7rem', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', padding: '0.2rem 0.5rem', borderRadius: '3px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                            SAML
                          </span>
                        )}
                        {app.oidcIdpEnabled && (
                          <span style={{ fontSize: '0.7rem', background: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee', padding: '0.2rem 0.5rem', borderRadius: '3px', border: '1px solid rgba(34, 211, 238, 0.3)' }}>
                            OIDC
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: app.status === 'ACTIVE' ? '#10b981' : '#6b7280',
                          }}
                        />
                        <span style={{ fontSize: '0.85rem', color: app.status === 'ACTIVE' ? '#10b981' : '#6b7280' }}>
                          {app.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/applications/${app.id}`);
                          }}
                          style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366f1',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '6px',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          Configure
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(app.id);
                          }}
                          disabled={deleting === app.id}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            padding: '0.4rem 0.625rem',
                            fontSize: '0.8rem',
                            cursor: deleting === app.id ? 'not-allowed' : 'pointer',
                            opacity: deleting === app.id ? 0.5 : 1,
                            transition: 'all 0.2s',
                          }}
                        >
                          {deleting === app.id ? '...' : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
