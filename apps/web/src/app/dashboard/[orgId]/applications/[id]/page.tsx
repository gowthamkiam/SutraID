'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { applicationApi, Application, groupsApi, usersApi } from '@/lib/api';

type Tab = 'general' | 'security' | 'endpoints' | 'guide' | 'assignments';

export default function ApplicationDetailPage({ params }: { params: Promise<{ orgId: string, id: string }> }) {
  const router = useRouter();
  const { orgId, id: appId } = use(params);
  // Remove local appId declaration since it's now destructured from params

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  // orgId is now available from use(params)

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [redirectUris, setRedirectUris] = useState('');
  const [grantTypes, setGrantTypes] = useState('');
  const [scopes, setScopes] = useState('');
  const [isPublicClient, setIsPublicClient] = useState(false);
  const [requireDpop, setRequireDpop] = useState(false);
  const [isAiAgent, setIsAiAgent] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [assignedGroupIds, setAssignedGroupIds] = useState<string[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Grant type controls
  const [allowROPC, setAllowROPC] = useState(false);
  const [allowClientCredentials, setAllowClientCredentials] = useState(false);
  const [allowRefreshForROPC, setAllowRefreshForROPC] = useState(false);
  const [pkceRequired, setPkceRequired] = useState(true);

  // SAML
  const [samlSpEntityId, setSamlSpEntityId] = useState('');
  const [samlSpAcsUrl, setSamlSpAcsUrl] = useState('');
  const [samlNameIdFormat, setSamlNameIdFormat] = useState('');

  useEffect(() => {
    if (orgId && appId) {
      loadApp();
      loadAssignments();
    }
  }, [orgId, appId]);

  const loadApp = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const data = await applicationApi.get(orgId, appId);
      setApp(data);
      setName(data.name);
      setDescription(data.description || '');
      setRedirectUris(Array.isArray(data.redirectUris) ? data.redirectUris.join('\n') : '');
      setGrantTypes(Array.isArray(data.grantTypes) ? data.grantTypes.join(',') : '');
      setScopes(Array.isArray(data.scopes) ? data.scopes.join(',') : '');
      setIsPublicClient(data.isPublicClient);
      setRequireDpop(data.requireDpop);
      setIsAiAgent(data.isAiAgent);
      setAllowROPC(data.allowROPC ?? false);
      setAllowClientCredentials(data.allowClientCredentials ?? false);
      setAllowRefreshForROPC(data.allowRefreshForROPC ?? false);
      setPkceRequired(data.pkceRequired ?? true);
      setSamlSpEntityId(data.samlSpEntityId || '');
      setSamlSpAcsUrl(data.samlSpAcsUrl || '');
      setSamlNameIdFormat(data.samlNameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!orgId) return;
    try {
      const [usersResult, groupsResult] = await Promise.all([
        usersApi.list({ page: 1, limit: 500 }),
        groupsApi.list({ page: 1, limit: 500 }),
      ]);
      setAllUsers(usersResult.users || []);
      setAllGroups(groupsResult.groups || []);
      setAssignedUserIds(
        (usersResult.users || [])
          .filter((u: any) => (u.applications || []).some((a: any) => a.id === appId))
          .map((u: any) => u.id),
      );
      setAssignedGroupIds(
        (groupsResult.groups || [])
          .filter((g: any) => (g.applications || []).some((a: any) => a.id === appId))
          .map((g: any) => g.id),
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments');
    }
  };

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await applicationApi.update(orgId, appId, {
        name,
        description: description || undefined,
        redirectUris: redirectUris.split('\n').map(s => s.trim()).filter(Boolean),
        grantTypes: grantTypes.split(',').map(s => s.trim()).filter(Boolean),
        scopes: scopes.split(',').map(s => s.trim()).filter(Boolean),
        isPublicClient,
        requireDpop,
        isAiAgent,
        allowROPC,
        allowClientCredentials,
        allowRefreshForROPC,
        pkceRequired,
        samlSpEntityId: samlSpEntityId || undefined,
        samlSpAcsUrl: samlSpAcsUrl || undefined,
        samlNameIdFormat: samlNameIdFormat || undefined,
      });
      setSuccess('Application updated successfully');
      await loadApp();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRotateSecret = async () => {
    if (!orgId) return;
    if (!confirm('Are you sure? The current client secret will be invalidated.')) return;
    try {
      const result = await applicationApi.rotateSecret(orgId, appId);
      alert(`New Client Secret (save this now!):\n\n${result.clientSecret}`);
    } catch (err: any) {
      alert('Failed to rotate secret: ' + err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  };

  const saveAssignments = async () => {
    if (!orgId) return;
    setSavingAssignments(true);
    setError(null);
    setSuccess(null);
    try {
      await Promise.all([
        applicationApi.setUsers(orgId, appId, assignedUserIds),
        applicationApi.setGroups(orgId, appId, assignedGroupIds),
      ]);
      setSuccess('Application assignments updated successfully');
      await loadAssignments();
    } catch (err: any) {
      setError(err.message || 'Failed to update assignments');
    } finally {
      setSavingAssignments(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    background: 'var(--bg-primary, #0f1419)',
    border: '1px solid var(--border-color, #30363d)',
    borderRadius: '8px', color: 'var(--text-primary, #e6edf3)',
    fontSize: '0.95rem', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.9rem', fontWeight: '600',
    marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)',
  };

  const readonlyFieldStyle: React.CSSProperties = {
    ...inputStyle,
    background: 'rgba(255,255,255,0.03)',
    cursor: 'pointer',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
  };

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    background: active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
    border: `1px solid ${active ? '#6366f1' : 'var(--border-color, #30363d)'}`,
    borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
    color: active ? '#a5b4fc' : 'var(--text-secondary, #7d8590)',
    transition: 'all 0.2s',
  });

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0f1419)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '60px', height: '60px', border: '4px solid rgba(99, 102, 241, 0.1)', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!app) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0f1419)', color: '#fca5a5', padding: '2rem', fontFamily: 'system-ui' }}>
        Application not found.
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'general', label: 'General', icon: '\u2699\uFE0F' },
    { key: 'security', label: 'Security', icon: '\uD83D\uDD12' },
    { key: 'endpoints', label: 'Endpoints', icon: '\uD83C\uDF10' },
    { key: 'assignments', label: 'Assignments', icon: '\uD83D\uDD17' },
    { key: 'guide', label: 'Integration Guide', icon: '\uD83D\uDCD6' },
  ];

  return (
    <div style={{
      minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'var(--bg-primary, #0f1419)', color: 'var(--text-primary, #e6edf3)'
    }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-card, #161b22)', borderBottom: '1px solid var(--border-color, #30363d)',
        padding: '1.25rem 2rem', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(8px)',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => router.push('/dashboard/applications')} style={{
              background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color, #30363d)',
              borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '1.1rem',
              color: 'var(--text-secondary, #7d8590)'
            }}>&#8592;</button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>{app.name}</h1>
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700',
                  background: app.type === 'OIDC' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: app.type === 'OIDC' ? '#a78bfa' : '#60a5fa',
                }}>
                  {app.type === 'OIDC' ? 'OAuth 2.1 / OIDC' : 'SAML 2.0'}
                </span>
              </div>
              {app.clientId && (
                <p style={{ color: 'var(--text-secondary, #7d8590)', margin: '0.25rem 0 0', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                  {app.clientId}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              background: saving ? '#4b5563' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', borderRadius: '8px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem', fontWeight: '600',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        {/* Alerts */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            {success}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color, #30363d)', paddingBottom: '0' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.75rem 1.25rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #6366f1' : '2px solid transparent',
                color: activeTab === tab.key ? '#a5b4fc' : 'var(--text-secondary, #7d8590)',
                cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>Application Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                {app.type === 'OIDC' && (
                  <>
                    <div>
                      <label style={labelStyle}>Redirect URIs (one per line)</label>
                      <textarea value={redirectUris} onChange={(e) => setRedirectUris(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Grant Types (comma-separated)</label>
                      <input type="text" value={grantTypes} onChange={(e) => setGrantTypes(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Scopes (comma-separated)</label>
                      <input type="text" value={scopes} onChange={(e) => setScopes(e.target.value)} style={inputStyle} />
                    </div>
                  </>
                )}

                {app.type === 'SAML' && (
                  <>
                    <div>
                      <label style={labelStyle}>SP Entity ID</label>
                      <input type="text" value={samlSpEntityId} onChange={(e) => setSamlSpEntityId(e.target.value)}
                        placeholder="e.g., https://app.example.com/saml/metadata" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>SP ACS URL</label>
                      <input type="text" value={samlSpAcsUrl} onChange={(e) => setSamlSpAcsUrl(e.target.value)}
                        placeholder="e.g., https://app.example.com/saml/acs" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>NameID Format</label>
                      <select value={samlNameIdFormat} onChange={(e) => setSamlNameIdFormat(e.target.value)}
                        style={{ ...inputStyle, appearance: 'auto' }}>
                        <option value="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">Email Address</option>
                        <option value="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent">Persistent</option>
                        <option value="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">Transient</option>
                        <option value="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">Unspecified</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Credentials */}
            {app.type === 'OIDC' && (
              <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>Credentials</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {app.clientId && (
                    <div>
                      <label style={labelStyle}>Client ID</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" value={app.clientId} readOnly style={{ ...readonlyFieldStyle, flex: 1 }} onClick={() => copyToClipboard(app.clientId!)} />
                        <button onClick={() => copyToClipboard(app.clientId!)} style={{
                          padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-color, #30363d)', borderRadius: '8px',
                          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                        }}>Copy</button>
                      </div>
                    </div>
                  )}
                  {!app.isPublicClient && !app.isAiAgent && (
                    <div>
                      <label style={labelStyle}>Client Secret</label>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', margin: '0 0 0.5rem' }}>
                        The client secret is only shown once at creation. Rotate to generate a new one.
                      </p>
                      <button onClick={handleRotateSecret} style={{
                        padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.15)',
                        color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500'
                      }}>Rotate Client Secret</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && app.type === 'OIDC' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>Security Features</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setIsPublicClient(!isPublicClient)} style={toggleStyle(isPublicClient)}>
                    {isPublicClient ? '● ' : '○ '}Public Client (SPA/Mobile)
                  </button>
                  <button type="button" onClick={() => setIsAiAgent(!isAiAgent)} style={toggleStyle(isAiAgent)}>
                    {isAiAgent ? '● ' : '○ '}AI Agent
                  </button>
                  <button type="button" onClick={() => setRequireDpop(!requireDpop)} style={toggleStyle(requireDpop)}>
                    {requireDpop ? '● ' : '○ '}Require DPoP
                  </button>
                </div>

                {requireDpop && (
                  <div style={{
                    background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)',
                    borderRadius: '8px', padding: '1rem', marginTop: '0.5rem'
                  }}>
                    <p style={{ fontSize: '0.85rem', color: '#fbbf24', margin: 0 }}>
                      <strong>DPoP Enabled:</strong> All token requests must include a valid DPoP proof JWT.
                      Access tokens will be bound to the client&apos;s proof-of-possession key.
                    </p>
                  </div>
                )}

                {isAiAgent && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px', padding: '1rem', marginTop: '0.5rem'
                  }}>
                    <p style={{ fontSize: '0.85rem', color: '#34d399', margin: 0 }}>
                      <strong>AI Agent Mode:</strong> This client is configured for autonomous AI agent authentication
                      using the client_credentials grant with JWK-based authentication.
                    </p>
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Token Endpoint Auth Method</label>
                  <input type="text" value={app.tokenEndpointAuthMethod} readOnly style={readonlyFieldStyle} />
                </div>
              </div>
            </div>

            {/* Grant Type Controls */}
            <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>Grant Type Controls</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setPkceRequired(!pkceRequired)} style={toggleStyle(pkceRequired)}>
                    {pkceRequired ? '\u25CF ' : '\u25CB '}Require PKCE
                  </button>
                  <button type="button" onClick={() => setAllowClientCredentials(!allowClientCredentials)} style={toggleStyle(allowClientCredentials)}>
                    {allowClientCredentials ? '\u25CF ' : '\u25CB '}Allow Client Credentials
                  </button>
                  <button type="button" onClick={() => {
                    if (isPublicClient && !allowROPC) {
                      setError('ROPC requires a confidential client. Disable "Public Client" first.');
                      return;
                    }
                    setAllowROPC(!allowROPC);
                  }} style={toggleStyle(allowROPC)}>
                    {allowROPC ? '\u25CF ' : '\u25CB '}Allow ROPC (Password Grant)
                  </button>
                </div>

                {allowROPC && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px', padding: '1rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem', borderRadius: '3px', fontSize: '0.65rem', fontWeight: '700',
                        background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontFamily: 'system-ui',
                      }}>LEGACY / HIGH RISK</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: '0 0 0.75rem' }}>
                      ROPC is deprecated in OAuth 2.1. Use only for legacy systems that cannot support authorization code flow.
                      ROPC issues access tokens only (no ID token). Rate limiting is enforced (5 attempts/min).
                    </p>
                    <button type="button" onClick={() => setAllowRefreshForROPC(!allowRefreshForROPC)} style={toggleStyle(allowRefreshForROPC)}>
                      {allowRefreshForROPC ? '\u25CF ' : '\u25CB '}Issue Refresh Tokens for ROPC
                    </button>
                  </div>
                )}

                {allowClientCredentials && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px', padding: '1rem',
                  }}>
                    <p style={{ fontSize: '0.85rem', color: '#34d399', margin: 0 }}>
                      Client Credentials enabled: machine-to-machine authentication using client_id + client_secret.
                      Issues access token only (no ID token, no refresh token). sub = client_id.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && app.type === 'SAML' && (
          <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>SAML Certificate</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', marginBottom: '1rem' }}>
              The SAML signing certificate was auto-generated when this application was created.
              Download the IdP metadata to get the full certificate.
            </p>
            {app.samlEntityId && (
              <div>
                <label style={labelStyle}>IdP Entity ID</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" value={app.samlEntityId} readOnly style={{ ...readonlyFieldStyle, flex: 1 }} onClick={() => copyToClipboard(app.samlEntityId!)} />
                  <button onClick={() => copyToClipboard(app.samlEntityId!)} style={{
                    padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-color, #30363d)', borderRadius: '8px',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                  }}>Copy</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && orgId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {app.type === 'OIDC' && (
              <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>OIDC / OAuth 2.1 Endpoints</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', marginBottom: '1rem' }}>
                  Use these endpoints to integrate your application with SutraID.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Discovery URL', value: applicationApi.getOidcDiscoveryUrl(orgId, appId) },
                    { label: 'Authorization Endpoint', value: applicationApi.getAuthorizeUrl(orgId, appId) },
                    { label: 'Token Endpoint', value: applicationApi.getTokenUrl(orgId, appId) },
                    { label: 'Introspection Endpoint', value: applicationApi.getIntrospectUrl(orgId, appId) },
                    { label: 'Revocation Endpoint', value: applicationApi.getRevokeUrl(orgId, appId) },
                    { label: 'DCR Endpoint', value: applicationApi.getDcrUrl(orgId, appId) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <label style={labelStyle}>{label}</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" value={value} readOnly style={{ ...readonlyFieldStyle, flex: 1 }}
                          onClick={() => copyToClipboard(value)} />
                        <button onClick={() => copyToClipboard(value)} style={{
                          padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-color, #30363d)', borderRadius: '8px',
                          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                        }}>Copy</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {app.type === 'SAML' && (
              <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>SAML 2.0 IdP Endpoints</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', marginBottom: '1rem' }}>
                  Provide these URLs to the external Service Provider for configuration.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'IdP Metadata URL', value: applicationApi.getSamlMetadataUrl(orgId, appId) },
                    { label: 'SSO URL (HTTP-POST)', value: applicationApi.getSamlSsoUrl(orgId, appId) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <label style={labelStyle}>{label}</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="text" value={value} readOnly style={{ ...readonlyFieldStyle, flex: 1 }}
                          onClick={() => copyToClipboard(value)} />
                        <button onClick={() => copyToClipboard(value)} style={{
                          padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-color, #30363d)', borderRadius: '8px',
                          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                        }}>Copy</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Integration Guide Tab */}
        {activeTab === 'assignments' && orgId && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Assign Users</h2>
              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border-color, #30363d)', borderRadius: 8, padding: '0.75rem' }}>
                {allUsers.map((user) => (
                  <label key={user.id} style={{ display: 'block', marginBottom: 6, color: 'var(--text-primary, #e6edf3)' }}>
                    <input
                      type="checkbox"
                      checked={assignedUserIds.includes(user.id)}
                      onChange={() =>
                        setAssignedUserIds((prev) =>
                          prev.includes(user.id) ? prev.filter((id) => id !== user.id) : [...prev, user.id],
                        )
                      }
                    />
                    <span style={{ marginLeft: 8 }}>{user.email}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Assign Groups</h2>
              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border-color, #30363d)', borderRadius: 8, padding: '0.75rem' }}>
                {allGroups.map((group) => (
                  <label key={group.id} style={{ display: 'block', marginBottom: 6, color: 'var(--text-primary, #e6edf3)' }}>
                    <input
                      type="checkbox"
                      checked={assignedGroupIds.includes(group.id)}
                      onChange={() =>
                        setAssignedGroupIds((prev) =>
                          prev.includes(group.id) ? prev.filter((id) => id !== group.id) : [...prev, group.id],
                        )
                      }
                    />
                    <span style={{ marginLeft: 8 }}>{group.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <button
                onClick={saveAssignments}
                disabled={savingAssignments}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: savingAssignments ? '#4b5563' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: savingAssignments ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                }}
              >
                {savingAssignments ? 'Saving...' : 'Save Assignments'}
              </button>
            </div>
          </div>
        )}

        {/* Integration Guide Tab */}
        {activeTab === 'guide' && orgId && (
          <IntegrationGuide
            app={app}
            orgId={orgId}
            appId={appId}
            labelStyle={labelStyle}
            samlNameIdFormat={samlNameIdFormat}
            copyToClipboard={copyToClipboard}
          />
        )}
      </main>
    </div>
  );
}

/* ============================================================================
 * Integration Guide Component
 * Client-type-aware guide with PKCE flow, quick test URL, and grant types
 * ========================================================================= */

function TokenResultPanel({ result, preStyle }: { result: any; preStyle: React.CSSProperties }) {
  const decoded = (() => {
    try {
      if (!result?.access_token) return null;
      const parts = result.access_token.split('.');
      if (parts.length < 2) return null;
      return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch { return null; }
  })();

  return (
    <div style={{ marginTop: '1rem' }}>
      {result.error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px', padding: '1rem',
        }}>
          <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: 0 }}>
            <strong>Error:</strong> {result.error} {result.error_description ? `- ${result.error_description}` : ''}
          </p>
        </div>
      )}
      {result.access_token && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary, #e6edf3)' }}>Access Token</label>
            <pre style={{ ...preStyle, fontSize: '0.7rem', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{result.access_token}</pre>
          </div>
          {decoded && (
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary, #e6edf3)' }}>Decoded Payload</label>
              <pre style={{ ...preStyle, fontSize: '0.75rem' }}>{JSON.stringify(decoded, null, 2)}</pre>
            </div>
          )}
          {result.refresh_token && (
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary, #e6edf3)' }}>Refresh Token</label>
              <pre style={{ ...preStyle, fontSize: '0.7rem', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{result.refresh_token}</pre>
            </div>
          )}
          {!result.id_token && (
            <p style={{ fontSize: '0.8rem', color: '#7d8590', margin: 0 }}>No ID token issued (expected for this grant type).</p>
          )}
          {result.id_token && (
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem', color: 'var(--text-primary, #e6edf3)' }}>ID Token</label>
              <pre style={{ ...preStyle, fontSize: '0.7rem', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{result.id_token}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IntegrationGuide({
  app,
  orgId,
  appId,
  labelStyle,
  samlNameIdFormat,
  copyToClipboard,
}: {
  app: Application;
  orgId: string;
  appId: string;
  labelStyle: React.CSSProperties;
  samlNameIdFormat: string;
  copyToClipboard: (text: string) => void;
}) {
  const [codeVerifier, setCodeVerifier] = useState<string | null>(null);
  const [testUrl, setTestUrl] = useState<string | null>(null);
  const [ropcUsername, setRopcUsername] = useState('');
  const [ropcPassword, setRopcPassword] = useState('');
  const [ropcResult, setRopcResult] = useState<any>(null);
  const [ccSecret, setCcSecret] = useState('');
  const [ccResult, setCcResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card, #161b22)',
    border: '1px solid var(--border-color, #30363d)',
    borderRadius: '12px',
    padding: '1.5rem',
  };

  const preStyle: React.CSSProperties = {
    background: '#0f1923',
    border: '1px solid var(--border-color, #30363d)',
    borderRadius: '8px',
    padding: '1rem',
    overflow: 'auto',
    fontSize: '0.8rem',
    color: '#a5b4fc',
    lineHeight: '1.6',
    margin: '0.5rem 0 0',
  };

  const appGrantTypes = Array.isArray(app.grantTypes) ? app.grantTypes : [];
  const appScopes = Array.isArray(app.scopes) ? app.scopes.join(' ') : 'openid';
  const clientId = app.clientId || '<CLIENT_ID>';
  const firstRedirectUri = Array.isArray(app.redirectUris) && app.redirectUris.length > 0
    ? app.redirectUris[0]
    : 'http://localhost:3000/callback';
  const authorizeUrl = applicationApi.getAuthorizeUrl(orgId, appId);
  const tokenUrl = applicationApi.getTokenUrl(orgId, appId);
  const discoveryUrl = applicationApi.getOidcDiscoveryUrl(orgId, appId);

  const clientType = app.isAiAgent
    ? 'ai_agent'
    : app.isPublicClient
      ? 'public'
      : 'confidential';

  const clientTypeLabel = app.isAiAgent
    ? 'AI Agent (Machine-to-Machine)'
    : app.isPublicClient
      ? 'Public Client (SPA / Mobile)'
      : 'Confidential Client (Server-Side)';

  const generateTestUrl = async () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    setCodeVerifier(verifier);

    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    const challenge = btoa(String.fromCharCode(...hashArray))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const state = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const nonce = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: firstRedirectUri,
      response_type: 'code',
      scope: appScopes,
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    const url = `${authorizeUrl}?${params.toString()}`;
    setTestUrl(url);
    window.open(url, '_blank');
  };

  // Grant types reference table
  const allGrantTypes = [
    {
      type: 'authorization_code',
      version: 'OAuth 2.0 / 2.1',
      useCase: 'User login via browser (web apps, mobile apps)',
      active: appGrantTypes.includes('authorization_code'),
    },
    {
      type: 'refresh_token',
      version: 'OAuth 2.0 / 2.1',
      useCase: 'Silent token refresh without re-authentication',
      active: appGrantTypes.includes('refresh_token'),
    },
    {
      type: 'client_credentials',
      version: 'OAuth 2.0 / 2.1',
      useCase: 'Machine-to-machine / AI agent authentication',
      active: app.allowClientCredentials,
    },
    {
      type: 'implicit',
      version: 'OAuth 2.0 only',
      useCase: 'Legacy SPAs (not supported per OAuth 2.1)',
      active: false,
      deprecated: true,
    },
    {
      type: 'password',
      version: 'OAuth 2.0 (deprecated in 2.1)',
      useCase: 'Legacy systems requiring direct username/password auth',
      active: app.allowROPC,
      deprecated: !app.allowROPC,
    },
    {
      type: 'urn:ietf:params:oauth:grant-type:device_code',
      version: 'OAuth 2.0 / 2.1',
      useCase: 'CLI tools, smart TVs, IoT devices',
      active: false,
      future: true,
    },
  ];

  if (app.type === 'SAML') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem', marginTop: 0 }}>
            SAML 2.0 Integration Guide
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>IdP Metadata XML</label>
              <pre style={{ ...preStyle, color: '#60a5fa' }}>{`<!-- Download from: -->
${applicationApi.getSamlMetadataUrl(orgId, appId)}

<!-- Or configure your SP with: -->
<IDPSSODescriptor>
  SSO URL: ${applicationApi.getSamlSsoUrl(orgId, appId)}
  NameID Format: ${samlNameIdFormat}
</IDPSSODescriptor>`}</pre>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', margin: 0 }}>
              Import the IdP Metadata URL into your Service Provider to complete the SAML configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Client Type Banner */}
      <div style={{
        ...cardStyle,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: '700',
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
          }}>
            {clientType === 'ai_agent' ? 'AI AGENT' : clientType === 'public' ? 'PUBLIC' : 'CONFIDENTIAL'}
          </span>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>{clientTypeLabel}</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', margin: 0 }}>
          {clientType === 'ai_agent'
            ? 'Uses client_credentials grant for autonomous machine-to-machine authentication. No user interaction required.'
            : clientType === 'public'
              ? 'Uses Authorization Code + PKCE flow without client_secret. Best for browser-based SPAs and mobile apps.'
              : 'Uses Authorization Code + PKCE flow with client_secret. Best for server-side web applications.'
          }
          {' '}SutraID enforces PKCE (S256) on all authorization code flows per OAuth 2.1.
        </p>
      </div>

      {/* Quick Test URL */}
      {clientType !== 'ai_agent' && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: 0 }}>
            Quick Test
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', margin: '0 0 1rem' }}>
            Click below to test the OAuth 2.1 authorization flow in your browser. This generates a PKCE code_verifier,
            computes the code_challenge, and opens the authorize endpoint.
          </p>
          <button
            onClick={generateTestUrl}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            Test Authorization Flow
          </button>
          {codeVerifier && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Generated code_verifier (save for token exchange)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={codeVerifier}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      background: '#0f1923',
                      border: '1px solid var(--border-color, #30363d)',
                      borderRadius: '6px',
                      color: '#34d399',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                    }}
                  />
                  <button
                    onClick={() => copyToClipboard(codeVerifier)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color, #30363d)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              {testUrl && (
                <div>
                  <label style={{ ...labelStyle, fontSize: '0.8rem' }}>Authorize URL</label>
                  <pre style={{ ...preStyle, fontSize: '0.75rem', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                    {testUrl}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ROPC Quick Test */}
      {app.allowROPC && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>Quick Test: ROPC (Password Grant)</h2>
            <span style={{
              padding: '0.15rem 0.5rem', borderRadius: '3px', fontSize: '0.65rem', fontWeight: '700',
              background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontFamily: 'system-ui',
            }}>LEGACY</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', margin: '0 0 1rem' }}>
            Test the ROPC flow. Issues access_token only (no ID token). All attempts are audit-logged.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              placeholder="Username (email)"
              value={ropcUsername}
              onChange={e => setRopcUsername(e.target.value)}
              style={{ ...cardStyle, padding: '0.6rem 0.75rem', background: 'var(--bg-primary, #0f1419)', border: '1px solid var(--border-color, #30363d)', borderRadius: '6px', color: 'var(--text-primary, #e6edf3)', fontSize: '0.85rem' }}
            />
            <input
              placeholder="Password"
              type="password"
              value={ropcPassword}
              onChange={e => setRopcPassword(e.target.value)}
              style={{ ...cardStyle, padding: '0.6rem 0.75rem', background: 'var(--bg-primary, #0f1419)', border: '1px solid var(--border-color, #30363d)', borderRadius: '6px', color: 'var(--text-primary, #e6edf3)', fontSize: '0.85rem' }}
            />
            <button
              onClick={async () => {
                setTestLoading(true);
                setRopcResult(null);
                try {
                  const response = await fetch(tokenUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                      grant_type: 'password',
                      client_id: clientId,
                      username: ropcUsername,
                      password: ropcPassword,
                      scope: appScopes,
                    }),
                  });
                  setRopcResult(await response.json());
                } catch (err: any) {
                  setRopcResult({ error: 'request_failed', error_description: err.message });
                } finally {
                  setTestLoading(false);
                }
              }}
              disabled={testLoading || !ropcUsername || !ropcPassword}
              style={{
                padding: '0.65rem 1.25rem', background: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
                opacity: testLoading || !ropcUsername || !ropcPassword ? 0.5 : 1,
                alignSelf: 'flex-start',
              }}
            >
              {testLoading ? 'Testing...' : 'Test ROPC Grant'}
            </button>
          </div>
          {ropcResult && <TokenResultPanel result={ropcResult} preStyle={preStyle} />}
        </div>
      )}

      {/* Client Credentials Quick Test */}
      {app.allowClientCredentials && !app.isPublicClient && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.75rem', marginTop: 0 }}>
            Quick Test: Client Credentials
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', margin: '0 0 1rem' }}>
            Test machine-to-machine authentication. Issues access_token only (no ID token, no refresh token). sub = client_id.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              placeholder="Client Secret"
              type="password"
              value={ccSecret}
              onChange={e => setCcSecret(e.target.value)}
              style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-primary, #0f1419)', border: '1px solid var(--border-color, #30363d)', borderRadius: '6px', color: 'var(--text-primary, #e6edf3)', fontSize: '0.85rem' }}
            />
            <button
              onClick={async () => {
                setTestLoading(true);
                setCcResult(null);
                try {
                  const response = await fetch(tokenUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                      grant_type: 'client_credentials',
                      client_id: clientId,
                      client_secret: ccSecret,
                      scope: appScopes,
                    }),
                  });
                  setCcResult(await response.json());
                } catch (err: any) {
                  setCcResult({ error: 'request_failed', error_description: err.message });
                } finally {
                  setTestLoading(false);
                }
              }}
              disabled={testLoading || !ccSecret}
              style={{
                padding: '0.65rem 1.25rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.1))',
                color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
                opacity: testLoading || !ccSecret ? 0.5 : 1,
                alignSelf: 'flex-start',
              }}
            >
              {testLoading ? 'Testing...' : 'Test Client Credentials'}
            </button>
          </div>
          {ccResult && <TokenResultPanel result={ccResult} preStyle={preStyle} />}
        </div>
      )}

      {/* Code Samples */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem', marginTop: 0 }}>
          Quick Start Integration
        </h2>

        {/* Public Client: PKCE flow without client_secret */}
        {clientType === 'public' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Step 1: Redirect to Authorize (Browser)</label>
              <pre style={preStyle}>{`// Generate PKCE values
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
}

const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

// Store verifier for token exchange
sessionStorage.setItem('pkce_verifier', codeVerifier);

// Redirect to authorize
const params = new URLSearchParams({
  client_id: '${clientId}',
  redirect_uri: '${firstRedirectUri}',
  response_type: 'code',
  scope: '${appScopes}',
  state: crypto.randomUUID(),
  nonce: crypto.randomUUID(),
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
});

window.location.href = \`${authorizeUrl}?\${params}\`;`}</pre>
            </div>
            <div>
              <label style={labelStyle}>Step 2: Exchange Code for Tokens (no client_secret)</label>
              <pre style={preStyle}>{`// In your callback handler
const code = new URLSearchParams(window.location.search).get('code');
const codeVerifier = sessionStorage.getItem('pkce_verifier');

const response = await fetch('${tokenUrl}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: '${clientId}',
    code,
    redirect_uri: '${firstRedirectUri}',
    code_verifier: codeVerifier,
  }),
});

const tokens = await response.json();
console.log('Access Token:', tokens.access_token);
console.log('ID Token:', tokens.id_token);`}</pre>
            </div>
            <div>
              <label style={labelStyle}>cURL: Token Exchange (PKCE)</label>
              <pre style={preStyle}>{`curl -X POST ${tokenUrl} \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "client_id=${clientId}" \\
  -d "code=<AUTHORIZATION_CODE>" \\
  -d "redirect_uri=${firstRedirectUri}" \\
  -d "code_verifier=<CODE_VERIFIER>"`}</pre>
            </div>
          </div>
        )}

        {/* Confidential Client: PKCE flow with client_secret */}
        {clientType === 'confidential' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Step 1: Generate Authorize URL (Server-Side)</label>
              <pre style={preStyle}>{`import crypto from 'crypto';

// Generate PKCE values
const codeVerifier = crypto.randomBytes(32)
  .toString('base64url');
const codeChallenge = crypto.createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// Store verifier in session for token exchange
req.session.pkceVerifier = codeVerifier;

// Build authorize URL
const params = new URLSearchParams({
  client_id: '${clientId}',
  redirect_uri: '${firstRedirectUri}',
  response_type: 'code',
  scope: '${appScopes}',
  state: crypto.randomUUID(),
  nonce: crypto.randomUUID(),
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
});

// Redirect user's browser
res.redirect(\`${authorizeUrl}?\${params}\`);`}</pre>
            </div>
            <div>
              <label style={labelStyle}>Step 2: Exchange Code for Tokens (with client_secret + PKCE)</label>
              <pre style={preStyle}>{`// In your callback route handler
const code = req.query.code;
const codeVerifier = req.session.pkceVerifier;

const response = await fetch('${tokenUrl}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: '${clientId}',
    client_secret: '<CLIENT_SECRET>',
    code,
    redirect_uri: '${firstRedirectUri}',
    code_verifier: codeVerifier,
  }),
});

const tokens = await response.json();
// { access_token, id_token, refresh_token, expires_in }`}</pre>
            </div>
            <div>
              <label style={labelStyle}>Python: Server-Side Flow</label>
              <pre style={preStyle}>{`import requests, hashlib, base64, os

# Generate PKCE
code_verifier = base64.urlsafe_b64encode(os.urandom(32)).rstrip(b'=').decode()
code_challenge = base64.urlsafe_b64encode(
    hashlib.sha256(code_verifier.encode()).digest()
).rstrip(b'=').decode()

# Step 1: Build authorize URL (redirect user to this)
authorize_url = (
    "${authorizeUrl}"
    "?client_id=${clientId}"
    "&redirect_uri=${firstRedirectUri}"
    "&response_type=code"
    "&scope=${appScopes}"
    f"&code_challenge={code_challenge}"
    "&code_challenge_method=S256"
)

# Step 2: Exchange code for tokens
token_response = requests.post("${tokenUrl}", data={
    "grant_type": "authorization_code",
    "client_id": "${clientId}",
    "client_secret": "<CLIENT_SECRET>",
    "code": "<AUTHORIZATION_CODE>",
    "redirect_uri": "${firstRedirectUri}",
    "code_verifier": code_verifier,
})
tokens = token_response.json()`}</pre>
            </div>
            <div>
              <label style={labelStyle}>cURL: Token Exchange</label>
              <pre style={preStyle}>{`curl -X POST ${tokenUrl} \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "client_id=${clientId}" \\
  -d "client_secret=<CLIENT_SECRET>" \\
  -d "code=<AUTHORIZATION_CODE>" \\
  -d "redirect_uri=${firstRedirectUri}" \\
  -d "code_verifier=<CODE_VERIFIER>"`}</pre>
            </div>
          </div>
        )}

        {/* AI Agent: Client Credentials */}
        {clientType === 'ai_agent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>cURL: Client Credentials</label>
              <pre style={preStyle}>{`curl -X POST ${tokenUrl} \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "client_id=${clientId}" \\
  -d "client_secret=<CLIENT_SECRET>" \\
  -d "scope=${appScopes}"`}</pre>
            </div>
            <div>
              <label style={labelStyle}>Node.js: Service-to-Service Auth</label>
              <pre style={preStyle}>{`const response = await fetch('${tokenUrl}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: '${clientId}',
    client_secret: '<CLIENT_SECRET>',
    scope: '${appScopes}',
  }),
});

const { access_token, expires_in } = await response.json();

// Use token for API calls
const apiResponse = await fetch('https://your-api.com/resource', {
  headers: { Authorization: \`Bearer \${access_token}\` },
});`}</pre>
            </div>
            <div>
              <label style={labelStyle}>Python: Agent Authentication</label>
              <pre style={preStyle}>{`import requests

token_response = requests.post("${tokenUrl}", data={
    "grant_type": "client_credentials",
    "client_id": "${clientId}",
    "client_secret": "<CLIENT_SECRET>",
    "scope": "${appScopes}",
})

access_token = token_response.json()["access_token"]

# Use token for API calls
response = requests.get("https://your-api.com/resource",
    headers={"Authorization": f"Bearer {access_token}"}
)`}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Grant Types Reference */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', marginTop: 0 }}>
          Supported Grant Types
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', margin: '0 0 1rem' }}>
          OAuth 2.1 removes the implicit and password grants and requires PKCE for all authorization code flows.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color, #30363d)' }}>
                {['Grant Type', 'OAuth Version', 'Use Case', 'This App'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '0.6rem 0.75rem',
                    color: 'var(--text-secondary, #7d8590)',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allGrantTypes.map((gt, i) => (
                <tr key={gt.type} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                }}>
                  <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    <span style={{
                      color: gt.deprecated ? '#f87171' : gt.future ? '#fbbf24' : '#e6edf3',
                    }}>
                      {gt.type.length > 30 ? 'device_code' : gt.type}
                    </span>
                    {gt.deprecated && (
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '3px',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        fontFamily: 'system-ui',
                      }}>
                        DEPRECATED
                      </span>
                    )}
                    {gt.future && (
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '3px',
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        background: 'rgba(234, 179, 8, 0.15)',
                        color: '#fbbf24',
                        fontFamily: 'system-ui',
                      }}>
                        PLANNED
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary, #7d8590)', whiteSpace: 'nowrap' }}>
                    {gt.version}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary, #7d8590)' }}>
                    {gt.useCase}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                    {gt.active ? (
                      <span style={{ color: '#34d399', fontWeight: '700', fontSize: '1rem' }}>&#10003;</span>
                    ) : (
                      <span style={{ color: '#6b7280', fontSize: '1rem' }}>&#8212;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OAuth 2.1 Info */}
      <div style={{
        ...cardStyle,
        background: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
      }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginTop: 0, marginBottom: '0.75rem', color: '#34d399' }}>
          OAuth 2.1 Compliance
        </h3>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', lineHeight: '1.7' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {[
              'PKCE required for all clients (S256)',
              'No implicit grant (use auth code + PKCE)',
              'ROPC disabled by default (legacy opt-in)',
              'Bearer + DPoP token binding',
              'One-time authorization codes',
              'Refresh token rotation',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#34d399', fontSize: '0.8rem' }}>&#10003;</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
