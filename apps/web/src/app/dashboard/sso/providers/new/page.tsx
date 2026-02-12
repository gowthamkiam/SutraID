'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ssoApi, CreateSsoProviderDto } from '@/lib/api';

type ProviderType = 'OKTA' | 'AZURE_AD' | 'GOOGLE_WORKSPACE' | 'GENERIC_SAML' | 'GENERIC_OIDC';
type Protocol = 'SAML2' | 'OIDC';

export default function NewSsoProviderPage() {
  const router = useRouter();
  const [protocol, setProtocol] = useState<Protocol>('SAML2');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CreateSsoProviderDto>>({
    name: '',
    type: 'GENERIC_SAML',
    protocol: 'SAML2',
    enabled: true,
    autoProvision: true,
    allowedDomains: [],
    oidcScopes: ['openid', 'profile', 'email'],
    attributeMapping: {},
  });

  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('currentOrgId');
    if (stored) setOrgId(stored);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) { setError('No organization found. Please complete onboarding first.'); return; }
    setError(null);
    setSubmitting(true);

    try {
      await ssoApi.createProvider(orgId, formData as CreateSsoProviderDto);
      router.push('/dashboard/sso/providers');
    } catch (err: any) {
      setError(err.message || 'Failed to create SSO provider');
      setSubmitting(false);
    }
  };

  const handleProtocolChange = (newProtocol: Protocol) => {
    setProtocol(newProtocol);
    setFormData({
      ...formData,
      protocol: newProtocol,
      type: newProtocol === 'SAML2' ? 'GENERIC_SAML' : 'GENERIC_OIDC',
    });
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const addAllowedDomain = () => {
    const domain = prompt('Enter allowed email domain (e.g., example.com):');
    if (domain) {
      updateField('allowedDomains', [...(formData.allowedDomains || []), domain]);
    }
  };

  const removeAllowedDomain = (domain: string) => {
    updateField('allowedDomains', (formData.allowedDomains || []).filter((d) => d !== domain));
  };

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
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <button
            onClick={() => router.push('/dashboard/sso/providers')}
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
            Add SSO Provider
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
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

        <form onSubmit={handleSubmit}>
          {/* Protocol Selection */}
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              1. Choose Protocol
            </h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => handleProtocolChange('SAML2')}
                style={{
                  flex: 1,
                  padding: '1.5rem',
                  background: protocol === 'SAML2' ? '#000' : '#fff',
                  color: protocol === 'SAML2' ? '#fff' : '#000',
                  border: '2px solid ' + (protocol === 'SAML2' ? '#000' : '#ddd'),
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
                <div>SAML 2.0</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '400', marginTop: '0.25rem', opacity: 0.8 }}>
                  Enterprise standard for SSO
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleProtocolChange('OIDC')}
                style={{
                  flex: 1,
                  padding: '1.5rem',
                  background: protocol === 'OIDC' ? '#000' : '#fff',
                  color: protocol === 'OIDC' ? '#fff' : '#000',
                  border: '2px solid ' + (protocol === 'OIDC' ? '#000' : '#ddd'),
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌐</div>
                <div>OpenID Connect</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '400', marginTop: '0.25rem', opacity: 0.8 }}>
                  Modern OAuth 2.0 based auth
                </div>
              </button>
            </div>
          </div>

          {/* Basic Configuration */}
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              2. Basic Configuration
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Provider Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Okta Enterprise SSO"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Provider Type <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => updateField('type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    background: '#fff'
                  }}
                >
                  {protocol === 'SAML2' ? (
                    <>
                      <option value="GENERIC_SAML">Generic SAML</option>
                      <option value="OKTA">Okta</option>
                      <option value="AZURE_AD">Azure AD</option>
                      <option value="GOOGLE_WORKSPACE">Google Workspace</option>
                    </>
                  ) : (
                    <>
                      <option value="GENERIC_OIDC">Generic OIDC</option>
                      <option value="OKTA">Okta</option>
                      <option value="AZURE_AD">Azure AD</option>
                      <option value="GOOGLE_WORKSPACE">Google Workspace</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Protocol-Specific Configuration */}
          {protocol === 'SAML2' ? (
            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                3. SAML Configuration
              </h2>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    SAML Entity ID <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.samlEntityId || ''}
                    onChange={(e) => updateField('samlEntityId', e.target.value)}
                    placeholder="e.g., http://www.okta.com/exk123456"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    SAML SSO URL <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.samlSsoUrl || ''}
                    onChange={(e) => updateField('samlSsoUrl', e.target.value)}
                    placeholder="e.g., https://dev-123456.okta.com/app/dev-123456_app/exk123456/sso/saml"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    X.509 Certificate <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    required
                    value={formData.samlCertificate || ''}
                    onChange={(e) => updateField('samlCertificate', e.target.value)}
                    placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDpDCCAoygAwIBAgIGAXo...&#10;-----END CERTIFICATE-----"
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                    Paste the IdP signing certificate (PEM format)
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    SAML Metadata URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.samlMetadataUrl || ''}
                    onChange={(e) => updateField('samlMetadataUrl', e.target.value)}
                    placeholder="e.g., https://dev-123456.okta.com/app/exk123456/sso/saml/metadata"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#fff',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                3. OIDC Configuration
              </h2>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    OIDC Issuer URL <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.oidcIssuer || ''}
                    onChange={(e) => updateField('oidcIssuer', e.target.value)}
                    placeholder="e.g., https://dev-123456.okta.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                    The OIDC provider's issuer URL (discovery endpoint)
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Client ID <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.oidcClientId || ''}
                    onChange={(e) => updateField('oidcClientId', e.target.value)}
                    placeholder="e.g., 0oa123456789abcdef"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Client Secret <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.oidcClientSecret || ''}
                    onChange={(e) => updateField('oidcClientSecret', e.target.value)}
                    placeholder="Enter client secret"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Scopes
                  </label>
                  <input
                    type="text"
                    value={(formData.oidcScopes || []).join(' ')}
                    onChange={(e) => updateField('oidcScopes', e.target.value.split(' '))}
                    placeholder="openid profile email"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                    Space-separated list of OAuth scopes
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              4. Security Settings
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => updateField('enabled', e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: '500' }}>Enable Provider</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      Allow users to authenticate with this provider
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.autoProvision}
                    onChange={(e) => updateField('autoProvision', e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: '500' }}>Auto-Provision Users</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      Automatically create user accounts on first SSO login
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Allowed Email Domains
                </label>
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  minHeight: '50px'
                }}>
                  {(formData.allowedDomains || []).length === 0 ? (
                    <div style={{ color: '#999', fontSize: '0.9rem' }}>
                      No domain restrictions (all domains allowed)
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {(formData.allowedDomains || []).map((domain) => (
                        <span
                          key={domain}
                          style={{
                            background: '#f3f4f6',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          {domain}
                          <button
                            type="button"
                            onClick={() => removeAllowedDomain(domain)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#dc2626',
                              fontSize: '1rem',
                              padding: 0
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addAllowedDomain}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 1rem',
                    background: '#fff',
                    color: '#000',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  + Add Domain
                </button>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                  Only users with these email domains can authenticate (leave empty to allow all)
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={() => router.push('/dashboard/sso/providers')}
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#fff',
                color: '#000',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500',
                opacity: submitting ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                background: submitting ? '#666' : '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              {submitting ? 'Creating...' : 'Create SSO Provider'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
