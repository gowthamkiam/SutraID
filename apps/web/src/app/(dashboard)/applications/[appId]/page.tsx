'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

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

const appTypeLabels: Record<string, string> = {
  WEB: 'Web Application',
  SPA: 'Single Page App',
  NATIVE_MOBILE: 'Native Mobile',
  M2M: 'Machine to Machine',
};

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [orgId, setOrgId] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [redirectUris, setRedirectUris] = useState<string[]>([]);
  const [allowedOrigins, setAllowedOrigins] = useState<string[]>([]);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

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
          if (orgs && orgs.length > 0) {
            setOrgId(orgs[0].id);
            localStorage.setItem('currentOrgId', orgs[0].id);
          } else {
            setLoading(false);
            setError('No organization found. Please complete onboarding first.');
          }
        })
        .catch(() => {
          setLoading(false);
          setError('Failed to load organization. Please log in again.');
        });
    }
  }, []);

  useEffect(() => {
    if (orgId && appId) loadApplication();
  }, [orgId, appId]);

  const loadApplication = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${apiUrl}/organizations/${orgId}/applications/${appId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load application');
      }

      const data = await response.json();
      setApplication(data);
      setName(data.name);
      setDescription(data.description || '');
      setLogoUrl(data.logoUrl || '');
      setRedirectUris(data.redirectUris || []);
      setAllowedOrigins(data.allowedOrigins || []);
      setStatus(data.status);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!orgId) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const accessToken = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const payload = {
        name,
        description: description.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        redirectUris: redirectUris.filter((uri) => uri.trim() !== ''),
        allowedOrigins: allowedOrigins.filter((origin) => origin.trim() !== ''),
        status,
      };

      const response = await fetch(`${apiUrl}/organizations/${orgId}/applications/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update application');
      }

      await loadApplication();
      setSuccessMessage('Application updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update application');
    } finally {
      setSaving(false);
    }
  };

  const handleRotateSecret = async () => {
    if (!confirm('Are you sure you want to rotate the client secret? The old secret will stop working immediately.')) {
      return;
    }

    if (!orgId) return;
    try {
      setRotating(true);
      setError(null);

      const accessToken = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${apiUrl}/organizations/${orgId}/applications/${appId}/rotate-secret`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to rotate secret');
      }

      const data = await response.json();
      alert(`New Client Secret (save this now!):\n\n${data.clientSecret}\n\nThis will only be shown once.`);
      await loadApplication();
    } catch (err: any) {
      setError(err.message || 'Failed to rotate secret');
    } finally {
      setRotating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    if (!orgId) return;
    try {
      const accessToken = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${apiUrl}/organizations/${orgId}/applications/${appId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete application');
      }

      router.push('/dashboard/applications');
    } catch (err: any) {
      setError(err.message || 'Failed to delete application');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary, #0f1419)' }}>
        <p style={{ color: 'var(--text-secondary, #8b949e)' }}>Loading application...</p>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary, #0f1419)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={() => router.push('/dashboard/applications')}
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
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0f1419)', color: 'var(--text-primary, #e6edf3)', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => router.push('/dashboard/applications')}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary, #8b949e)',
              border: 'none',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.5rem',
              borderRadius: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
              e.currentTarget.style.color = '#6366f1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary, #8b949e)';
            }}
          >
            <span>←</span>
            <span>Back to Applications</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1rem' }}>
            {/* Logo */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '12px',
              background: logoUrl ? `url(${logoUrl})` : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid var(--border-color, #30363d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              flexShrink: 0,
            }}>
              {!logoUrl && application && ['🌐', '⚡', '📱', '🤖'][['WEB', 'SPA', 'NATIVE_MOBILE', 'M2M'].indexOf(application.type)]}
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
                {application?.name}
              </h1>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #8b949e)' }}>
                  {application && appTypeLabels[application.type]}
                </span>
                <span style={{ fontSize: '0.9rem', color: status === 'ACTIVE' ? '#10b981' : '#6b7280', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status === 'ACTIVE' ? '#10b981' : '#6b7280' }} />
                  {status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => router.push(`/dashboard/applications/${appId}/sso`)}
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '8px',
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.9rem',
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
                Configure SSO
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
          </div>
        )}
        {successMessage && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#10b981', margin: 0 }}>{successMessage}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Left Column - General Settings */}
          <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>General Settings</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
                Application Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-primary, #0f1419)',
                  border: '1px solid var(--border-color, #30363d)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: 'var(--text-primary, #e6edf3)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color, #30363d)')}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg-primary, #0f1419)',
                  border: '1px solid var(--border-color, #30363d)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: 'var(--text-primary, #e6edf3)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color, #30363d)')}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
                Logo URL
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                style={{
                  width: '100%',
                  background: 'var(--bg-primary, #0f1419)',
                  border: '1px solid var(--border-color, #30363d)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: 'var(--text-primary, #e6edf3)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color, #30363d)')}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                style={{
                  width: '100%',
                  background: 'var(--bg-primary, #0f1419)',
                  border: '1px solid var(--border-color, #30363d)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: 'var(--text-primary, #e6edf3)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              style={{
                width: '100%',
                background: saving || !name.trim() ? 'rgba(99, 102, 241, 0.3)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Right Column - Credentials & Config */}
          <div>
            {/* Credentials */}
            <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Credentials</h2>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '0.5rem' }}>
                  Client ID
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <code style={{ flex: 1, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', fontFamily: 'monospace', overflow: 'auto' }}>
                    {application?.clientId}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(application?.clientId || '');
                      setSuccessMessage('Client ID copied to clipboard!');
                      setTimeout(() => setSuccessMessage(null), 2000);
                    }}
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#6366f1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '6px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    📋
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '0.5rem' }}>
                  Client Secret
                </label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '0.75rem' }}>
                  The client secret is only shown once during creation. If you&apos;ve lost it, you can rotate it.
                </p>
                <button
                  onClick={handleRotateSecret}
                  disabled={rotating}
                  style={{
                    background: rotating ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.1)',
                    color: '#fbbf24',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '6px',
                    padding: '0.625rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    cursor: rotating ? 'not-allowed' : 'pointer',
                    width: '100%',
                  }}
                >
                  {rotating ? 'Rotating...' : '🔄 Rotate Client Secret'}
                </button>
              </div>
            </div>

            {/* URIs */}
            <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>URLs</h2>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
                  Redirect URIs *
                </label>
                {redirectUris.map((uri, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={uri}
                      onChange={(e) => {
                        const newUris = [...redirectUris];
                        newUris[index] = e.target.value;
                        setRedirectUris(newUris);
                      }}
                      style={{
                        flex: 1,
                        background: 'var(--bg-primary, #0f1419)',
                        border: '1px solid var(--border-color, #30363d)',
                        borderRadius: '6px',
                        padding: '0.625rem 0.875rem',
                        color: 'var(--text-primary, #e6edf3)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                    {redirectUris.length > 1 && (
                      <button
                        onClick={() => setRedirectUris(redirectUris.filter((_, i) => i !== index))}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          padding: '0.625rem 0.875rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setRedirectUris([...redirectUris, ''])}
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.875rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  + Add URI
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#ef4444' }}>Danger Zone</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '1rem' }}>
                Deleting this application will permanently remove all configuration and cannot be undone.
              </p>
              <button
                onClick={handleDelete}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '6px',
                  padding: '0.625rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                🗑️ Delete Application
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
