'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { applicationApi, Application, groupsApi, usersApi } from '@/lib/api';

type Tab = 'general' | 'security' | 'endpoints' | 'guide' | 'assignments';

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.id as string;

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [orgId, setOrgId] = useState<string | null>(null);

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

  // SAML
  const [samlSpEntityId, setSamlSpEntityId] = useState('');
  const [samlSpAcsUrl, setSamlSpAcsUrl] = useState('');
  const [samlNameIdFormat, setSamlNameIdFormat] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('currentOrgId');
    if (stored) setOrgId(stored);
  }, []);

  useEffect(() => {
    if (orgId && appId) loadApp();
  }, [orgId, appId]);

  useEffect(() => {
    if (orgId && appId) loadAssignments();
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
                    { label: 'Discovery URL', value: applicationApi.getOidcDiscoveryUrl(orgId) },
                    { label: 'Token Endpoint', value: applicationApi.getTokenUrl() },
                    { label: 'Introspection Endpoint', value: applicationApi.getIntrospectUrl() },
                    { label: 'Revocation Endpoint', value: applicationApi.getRevokeUrl() },
                    { label: 'DCR Endpoint', value: applicationApi.getDcrUrl() },
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>Quick Start Integration</h2>

              {app.type === 'OIDC' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={labelStyle}>cURL — Token Request (Client Credentials)</label>
                    <pre style={{
                      background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color, #30363d)',
                      borderRadius: '8px', padding: '1rem', overflow: 'auto',
                      fontSize: '0.8rem', color: '#a5b4fc', lineHeight: '1.5'
                    }}>{`curl -X POST ${applicationApi.getTokenUrl()} \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "client_id=${app.clientId || '<CLIENT_ID>'}" \\
  -d "client_secret=<CLIENT_SECRET>" \\
  -d "scope=${Array.isArray(app.scopes) ? app.scopes.join(' ') : 'openid'}"`}</pre>
                  </div>
                  <div>
                    <label style={labelStyle}>Node.js — openid-client</label>
                    <pre style={{
                      background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color, #30363d)',
                      borderRadius: '8px', padding: '1rem', overflow: 'auto',
                      fontSize: '0.8rem', color: '#a5b4fc', lineHeight: '1.5'
                    }}>{`const { Issuer } = require('openid-client');

const issuer = await Issuer.discover(
  '${applicationApi.getOidcDiscoveryUrl(orgId)}'
);

const client = new issuer.Client({
  client_id: '${app.clientId || '<CLIENT_ID>'}',
  client_secret: '<CLIENT_SECRET>',
});

const tokenSet = await client.grant({
  grant_type: 'client_credentials',
});

console.log('Access Token:', tokenSet.access_token);`}</pre>
                  </div>
                </div>
              )}

              {app.type === 'SAML' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={labelStyle}>IdP Metadata XML</label>
                    <pre style={{
                      background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color, #30363d)',
                      borderRadius: '8px', padding: '1rem', overflow: 'auto',
                      fontSize: '0.8rem', color: '#60a5fa', lineHeight: '1.5'
                    }}>{`<!-- Download from: -->
${applicationApi.getSamlMetadataUrl(orgId, appId)}

<!-- Or configure your SP with: -->
<IDPSSODescriptor>
  SSO URL: ${applicationApi.getSamlSsoUrl(orgId, appId)}
  NameID Format: ${samlNameIdFormat}
</IDPSSODescriptor>`}</pre>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)' }}>
                    Import the IdP Metadata URL into your Service Provider to complete the SAML configuration.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
