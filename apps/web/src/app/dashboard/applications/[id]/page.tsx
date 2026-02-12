'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { applicationApi, Application } from '@/lib/api';

type Tab = 'general' | 'saml-idp' | 'oidc-idp';

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
  const [allowedOrigins, setAllowedOrigins] = useState('');

  // SAML IdP state
  const [samlIdpEnabled, setSamlIdpEnabled] = useState(false);
  const [samlSpEntityId, setSamlSpEntityId] = useState('');
  const [samlSpAcsUrl, setSamlSpAcsUrl] = useState('');
  const [samlNameIdFormat, setSamlNameIdFormat] = useState('urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');

  // OIDC IdP state
  const [oidcIdpEnabled, setOidcIdpEnabled] = useState(false);
  const [oidcScopes, setOidcScopes] = useState('openid profile email');

  useEffect(() => {
    const stored = localStorage.getItem('currentOrgId');
    if (stored) setOrgId(stored);
  }, []);

  useEffect(() => {
    if (orgId && appId) loadApp();
  }, [orgId, appId]);

  const loadApp = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const data = await applicationApi.get(orgId, appId);
      setApp(data);
      // Populate form
      setName(data.name);
      setDescription(data.description || '');
      setRedirectUris(data.redirectUris.join('\n'));
      setAllowedOrigins(data.allowedOrigins.join('\n'));
      setSamlIdpEnabled(data.samlIdpEnabled);
      setSamlSpEntityId(data.samlSpEntityId || '');
      setSamlSpAcsUrl(data.samlSpAcsUrl || '');
      setSamlNameIdFormat(data.samlNameIdFormat || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');
      setOidcIdpEnabled(data.oidcIdpEnabled);
      setOidcScopes(data.oidcScopes?.join(' ') || 'openid profile email');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        allowedOrigins: allowedOrigins.split('\n').map(s => s.trim()).filter(Boolean),
        samlIdpEnabled,
        samlSpEntityId: samlSpEntityId || undefined,
        samlSpAcsUrl: samlSpAcsUrl || undefined,
        samlNameIdFormat: samlNameIdFormat || undefined,
        oidcIdpEnabled,
        oidcScopes: oidcScopes.split(' ').filter(Boolean),
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
    { key: 'saml-idp', label: 'SAML IdP', icon: '\uD83D\uDD10' },
    { key: 'oidc-idp', label: 'OIDC IdP', icon: '\uD83D\uDD11' },
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
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem' }}>{app.name}</h1>
              <p style={{ color: 'var(--text-secondary, #7d8590)', margin: 0, fontSize: '0.85rem' }}>
                {app.clientId}
              </p>
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
              {tab.key === 'saml-idp' && samlIdpEnabled && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              )}
              {tab.key === 'oidc-idp' && oidcIdpEnabled && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              )}
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
                <div>
                  <label style={labelStyle}>Redirect URIs (one per line)</label>
                  <textarea value={redirectUris} onChange={(e) => setRedirectUris(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={labelStyle}>Allowed Origins (one per line)</label>
                  <textarea value={allowedOrigins} onChange={(e) => setAllowedOrigins(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>Credentials</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Client ID</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" value={app.clientId} readOnly style={{ ...readonlyFieldStyle, flex: 1 }} onClick={() => copyToClipboard(app.clientId)} />
                    <button onClick={() => copyToClipboard(app.clientId)} style={{
                      padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-color, #30363d)', borderRadius: '8px',
                      color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                    }}>Copy</button>
                  </div>
                </div>
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
              </div>
            </div>
          </div>
        )}

        {/* SAML IdP Tab */}
        {activeTab === 'saml-idp' && orgId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>SAML 2.0 Identity Provider</h2>
                <button
                  onClick={() => setSamlIdpEnabled(!samlIdpEnabled)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: samlIdpEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(125, 133, 144, 0.15)',
                    color: samlIdpEnabled ? '#34d399' : 'var(--text-secondary, #7d8590)',
                    border: `1px solid ${samlIdpEnabled ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color, #30363d)'}`,
                    borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'
                  }}
                >
                  {samlIdpEnabled ? '\u25CF Enabled' : '\u25CB Disabled'}
                </button>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #7d8590)', marginBottom: '1.5rem' }}>
                Enable SutraID as a SAML 2.0 Identity Provider for this application. External Service Providers can authenticate users through SutraID.
              </p>

              {samlIdpEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>SP Entity ID *</label>
                    <input type="text" value={samlSpEntityId} onChange={(e) => setSamlSpEntityId(e.target.value)}
                      placeholder="e.g., https://app.example.com/saml/metadata" style={inputStyle} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary, #6e7681)', marginTop: '0.25rem' }}>
                      The Entity ID of the external Service Provider
                    </p>
                  </div>
                  <div>
                    <label style={labelStyle}>SP ACS URL *</label>
                    <input type="text" value={samlSpAcsUrl} onChange={(e) => setSamlSpAcsUrl(e.target.value)}
                      placeholder="e.g., https://app.example.com/saml/acs" style={inputStyle} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary, #6e7681)', marginTop: '0.25rem' }}>
                      Assertion Consumer Service URL where SAML responses will be sent
                    </p>
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
                </div>
              )}
            </div>

            {/* SAML IdP Endpoints (read-only) */}
            {samlIdpEnabled && orgId && (
              <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>IdP Endpoints</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', marginBottom: '1rem' }}>
                  Provide these URLs to the Service Provider for configuration.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>IdP Metadata URL</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" value={applicationApi.getSamlIdpMetadataUrl(orgId)} readOnly
                        style={{ ...readonlyFieldStyle, flex: 1 }}
                        onClick={() => copyToClipboard(applicationApi.getSamlIdpMetadataUrl(orgId))} />
                      <button onClick={() => copyToClipboard(applicationApi.getSamlIdpMetadataUrl(orgId))} style={{
                        padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-color, #30363d)', borderRadius: '8px',
                        color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                      }}>Copy</button>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>SSO URL</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" value={applicationApi.getSamlIdpSsoUrl(orgId)} readOnly
                        style={{ ...readonlyFieldStyle, flex: 1 }}
                        onClick={() => copyToClipboard(applicationApi.getSamlIdpSsoUrl(orgId))} />
                      <button onClick={() => copyToClipboard(applicationApi.getSamlIdpSsoUrl(orgId))} style={{
                        padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-color, #30363d)', borderRadius: '8px',
                        color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                      }}>Copy</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OIDC IdP Tab */}
        {activeTab === 'oidc-idp' && orgId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>OpenID Connect Identity Provider</h2>
                <button
                  onClick={() => setOidcIdpEnabled(!oidcIdpEnabled)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: oidcIdpEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(125, 133, 144, 0.15)',
                    color: oidcIdpEnabled ? '#34d399' : 'var(--text-secondary, #7d8590)',
                    border: `1px solid ${oidcIdpEnabled ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color, #30363d)'}`,
                    borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600'
                  }}
                >
                  {oidcIdpEnabled ? '\u25CF Enabled' : '\u25CB Disabled'}
                </button>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #7d8590)', marginBottom: '1.5rem' }}>
                Enable SutraID as an OIDC Identity Provider. External applications can use OAuth 2.0 / OpenID Connect to authenticate users.
              </p>

              {oidcIdpEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Allowed Scopes</label>
                    <input type="text" value={oidcScopes} onChange={(e) => setOidcScopes(e.target.value)}
                      placeholder="openid profile email" style={inputStyle} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary, #6e7681)', marginTop: '0.25rem' }}>
                      Space-separated list of allowed OIDC scopes
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* OIDC IdP Endpoints (read-only) */}
            {oidcIdpEnabled && orgId && (
              <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>OIDC Endpoints</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', marginBottom: '1rem' }}>
                  Use these URLs to configure the external application as an OIDC client.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Discovery URL', value: applicationApi.getOidcIdpDiscoveryUrl(orgId) },
                    { label: 'Authorization Endpoint', value: applicationApi.getOidcIdpAuthorizeUrl(orgId) },
                    { label: 'Token Endpoint', value: applicationApi.getOidcIdpTokenUrl(orgId) },
                    { label: 'JWKS URI', value: applicationApi.getOidcIdpJwksUrl(orgId) },
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
                  <div>
                    <label style={labelStyle}>Client ID</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" value={app.clientId} readOnly style={{ ...readonlyFieldStyle, flex: 1 }}
                        onClick={() => copyToClipboard(app.clientId)} />
                      <button onClick={() => copyToClipboard(app.clientId)} style={{
                        padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-color, #30363d)', borderRadius: '8px',
                        color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem'
                      }}>Copy</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
