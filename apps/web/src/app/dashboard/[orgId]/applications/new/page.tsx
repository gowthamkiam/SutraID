'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { applicationApi, ApplicationProtocol } from '@/lib/api';

export default function NewApplicationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Step 1: Protocol
  const [protocol, setProtocol] = useState<ApplicationProtocol>('OIDC');

  // Step 2: Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [redirectUris, setRedirectUris] = useState('');

  // OIDC-specific
  const [isPublicClient, setIsPublicClient] = useState(false);
  const [isAiAgent, setIsAiAgent] = useState(false);
  const [requireDpop, setRequireDpop] = useState(false);
  const [grantTypes, setGrantTypes] = useState('authorization_code,refresh_token');
  const [scopes, setScopes] = useState('openid,profile,email');

  // SAML-specific
  const [samlSpEntityId, setSamlSpEntityId] = useState('');
  const [samlSpAcsUrl, setSamlSpAcsUrl] = useState('');
  const [samlNameIdFormat, setSamlNameIdFormat] = useState('urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress');
  const [samlAttributeMapping, setSamlAttributeMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem('currentOrgId');
    if (stored) setOrgId(stored);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) { setError('No organization found.'); return; }
    if (!name.trim()) { setError('Name is required.'); return; }

    setError(null);
    setSubmitting(true);
    try {
      const result = await applicationApi.create(orgId, {
        name: name.trim(),
        description: description.trim() || undefined,
        type: protocol,
        redirectUris: redirectUris.split('\n').map(s => s.trim()).filter(Boolean),
        grantTypes: protocol === 'OIDC' ? grantTypes.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        scopes: protocol === 'OIDC' ? scopes.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        isPublicClient: protocol === 'OIDC' ? isPublicClient : undefined,
        isAiAgent: protocol === 'OIDC' ? isAiAgent : undefined,
        requireDpop: protocol === 'OIDC' ? requireDpop : undefined,
        samlSpEntityId: protocol === 'SAML' ? samlSpEntityId || undefined : undefined,
        samlSpAcsUrl: protocol === 'SAML' ? samlSpAcsUrl || undefined : undefined,
        samlNameIdFormat: protocol === 'SAML' ? samlNameIdFormat : undefined,
        samlAttributeMapping: protocol === 'SAML' && Object.keys(samlAttributeMapping).length > 0 ? samlAttributeMapping : undefined,
      });
      if (result.clientSecret) {
        setCreatedSecret(result.clientSecret);
      } else {
        router.push(`/dashboard/${orgId}/applications`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create application');
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    background: active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
    border: `1px solid ${active ? '#6366f1' : 'var(--border-color, #30363d)'}`,
    borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
    color: active ? '#a5b4fc' : 'var(--text-secondary, #7d8590)',
    transition: 'all 0.2s',
  });

  // Show secret after creation
  if (createdSecret) {
    return (
      <div style={{
        minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'var(--bg-primary, #0f1419)', color: 'var(--text-primary, #e6edf3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
      }}>
        <div style={{
          background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)',
          borderRadius: '16px', padding: '2.5rem', maxWidth: '600px', width: '100%', textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#9989;</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Application Created!</h1>
          <p style={{ color: 'var(--text-secondary, #7d8590)', marginBottom: '2rem' }}>
            Save your client secret now. It will not be shown again.
          </p>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ ...labelStyle, color: '#fca5a5', fontSize: '0.8rem' }}>CLIENT SECRET (save this now!)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <code style={{
                flex: 1, padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px',
                fontSize: '0.8rem', wordBreak: 'break-all', textAlign: 'left', color: '#e6edf3'
              }}>
                {createdSecret}
              </code>
              <button onClick={() => copyToClipboard(createdSecret)} style={{
                padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color, #30363d)', borderRadius: '8px',
                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0
              }}>Copy</button>
            </div>
          </div>

          <button
            onClick={() => router.push(`/dashboard/${orgId}/applications`)}
            style={{
              padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '1rem', fontWeight: '600'
            }}
          >
            Go to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'var(--bg-primary, #0f1419)', color: 'var(--text-primary, #e6edf3)'
    }}>
      <header style={{
        background: 'var(--bg-card, #161b22)', borderBottom: '1px solid var(--border-color, #30363d)',
        padding: '1.25rem 2rem', position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.push(`/dashboard/${orgId}/applications`)} style={{
            background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color, #30363d)',
            borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '1.1rem',
            color: 'var(--text-secondary, #7d8590)'
          }}>&#8592;</button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>New Application</h1>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Protocol Selection */}
          <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Protocol</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {([
                { value: 'OIDC' as ApplicationProtocol, label: 'OAuth 2.1 / OIDC', icon: '\uD83D\uDD11', desc: 'OpenID Connect with OAuth 2.1 security' },
                { value: 'SAML' as ApplicationProtocol, label: 'SAML 2.0', icon: '\uD83D\uDD10', desc: 'SAML 2.0 Identity Provider' },
              ]).map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setProtocol(p.value)}
                  style={{
                    background: protocol === p.value ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-primary, #0f1419)',
                    border: `2px solid ${protocol === p.value ? '#6366f1' : 'var(--border-color, #30363d)'}`,
                    borderRadius: '10px', padding: '1.25rem', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s', color: 'inherit'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{p.icon}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem' }}>{p.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #7d8590)' }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Basic Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Application Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="My Application" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your application" rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              {protocol === 'OIDC' && (
                <div>
                  <label style={labelStyle}>Redirect URIs (one per line)</label>
                  <textarea value={redirectUris} onChange={(e) => setRedirectUris(e.target.value)}
                    placeholder="https://myapp.com/callback" rows={3}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }} />
                </div>
              )}
            </div>
          </div>

          {/* OIDC-specific */}
          {protocol === 'OIDC' && (
            <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>OAuth 2.1 Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Grant Types (comma-separated)</label>
                  <input type="text" value={grantTypes} onChange={(e) => setGrantTypes(e.target.value)}
                    placeholder="authorization_code,refresh_token" style={inputStyle} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary, #6e7681)', marginTop: '0.25rem' }}>
                    Common: authorization_code, client_credentials, refresh_token
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>Scopes (comma-separated)</label>
                  <input type="text" value={scopes} onChange={(e) => setScopes(e.target.value)}
                    placeholder="openid,profile,email" style={inputStyle} />
                </div>
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
              </div>
            </div>
          )}

          {/* SAML-specific */}
          {protocol === 'SAML' && (
            <>
              <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>SAML 2.0 Settings</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>SP Entity ID</label>
                    <input type="text" value={samlSpEntityId} onChange={(e) => setSamlSpEntityId(e.target.value)}
                      placeholder="https://app.example.com/saml/metadata" style={inputStyle} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary, #6e7681)', marginTop: '0.25rem' }}>
                      The Entity ID of the Service Provider you are connecting to
                    </p>
                  </div>
                  <div>
                    <label style={labelStyle}>SP ACS URL</label>
                    <input type="text" value={samlSpAcsUrl} onChange={(e) => setSamlSpAcsUrl(e.target.value)}
                      placeholder="https://app.example.com/saml/acs" style={inputStyle} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary, #6e7681)', marginTop: '0.25rem' }}>
                      Assertion Consumer Service URL where SAML responses are sent
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
              </div>

              <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>SAML Attribute Mapping</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', marginBottom: '1rem' }}>
                  Map SutraID user attributes to SAML assertion attributes expected by the Service Provider
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Object.entries(samlAttributeMapping).map(([spAttr, idpAttr]) => (
                    <div key={spAttr} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="text" value={spAttr} onChange={(e) => {
                        const newMapping = { ...samlAttributeMapping };
                        delete newMapping[spAttr];
                        newMapping[e.target.value] = idpAttr;
                        setSamlAttributeMapping(newMapping);
                      }} placeholder="SP Attribute Name" style={{ ...inputStyle, flex: 1 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>→</span>
                      <select value={idpAttr} onChange={(e) => setSamlAttributeMapping({ ...samlAttributeMapping, [spAttr]: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                        <option value="email">email</option>
                        <option value="firstName">firstName</option>
                        <option value="lastName">lastName</option>
                        <option value="displayName">displayName</option>
                        <option value="userId">userId</option>
                      </select>
                      <button type="button" onClick={() => {
                        const newMapping = { ...samlAttributeMapping };
                        delete newMapping[spAttr];
                        setSamlAttributeMapping(newMapping);
                      }} style={{ padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setSamlAttributeMapping({ ...samlAttributeMapping, '': 'email' })} style={{ padding: '0.6rem 1rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>+ Add Attribute Mapping</button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '0.85rem',
              background: submitting ? '#4b5563' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '1rem', fontWeight: '600',
              boxShadow: submitting ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            {submitting ? 'Creating...' : 'Create Application'}
          </button>
        </form>
      </main>
    </div>
  );
}
