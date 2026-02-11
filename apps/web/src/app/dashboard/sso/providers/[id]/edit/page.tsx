'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ssoApi, SsoProvider, CreateSsoProviderDto } from '@/lib/api';

type ProviderType = 'OKTA' | 'AZURE_AD' | 'GOOGLE_WORKSPACE' | 'GENERIC_SAML' | 'GENERIC_OIDC';
type Protocol = 'SAML2' | 'OIDC';

export default function EditSsoProviderPage() {
  const router = useRouter();
  const params = useParams();
  const providerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<Protocol>('SAML2');

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

  // Track whether sensitive fields have been modified
  const [certModified, setCertModified] = useState(false);
  const [secretModified, setSecretModified] = useState(false);

  const orgId = 'org_demo_123';

  useEffect(() => {
    loadProvider();
  }, [providerId]);

  const loadProvider = async () => {
    try {
      setLoading(true);
      const provider = await ssoApi.getProvider(orgId, providerId);
      setProtocol(provider.protocol as Protocol);
      setFormData({
        name: provider.name,
        type: provider.type,
        protocol: provider.protocol,
        enabled: provider.enabled,
        autoProvision: provider.autoProvision,
        allowedDomains: provider.allowedDomains || [],
        samlEntityId: provider.samlEntityId || '',
        samlSsoUrl: provider.samlSsoUrl || '',
        samlMetadataUrl: provider.samlMetadataUrl || '',
        oidcIssuer: provider.oidcIssuer || '',
        oidcClientId: provider.oidcClientId || '',
        oidcScopes: provider.oidcScopes || ['openid', 'profile', 'email'],
        attributeMapping: provider.attributeMapping || {},
        // Sensitive fields are NOT returned from the API
        samlCertificate: '',
        oidcClientSecret: '',
      });
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load provider');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const updateData: Partial<CreateSsoProviderDto> = {
        name: formData.name,
        enabled: formData.enabled,
        autoProvision: formData.autoProvision,
        allowedDomains: formData.allowedDomains,
      };

      if (protocol === 'SAML2') {
        updateData.samlEntityId = formData.samlEntityId;
        updateData.samlSsoUrl = formData.samlSsoUrl;
        updateData.samlMetadataUrl = formData.samlMetadataUrl;
        if (certModified && formData.samlCertificate) {
          updateData.samlCertificate = formData.samlCertificate;
        }
      } else {
        updateData.oidcIssuer = formData.oidcIssuer;
        updateData.oidcClientId = formData.oidcClientId;
        updateData.oidcScopes = formData.oidcScopes;
        if (secretModified && formData.oidcClientSecret) {
          updateData.oidcClientSecret = formData.oidcClientSecret;
        }
      }

      await ssoApi.updateProvider(orgId, providerId, updateData);
      router.push('/dashboard/sso/providers');
    } catch (err: any) {
      setError(err.message || 'Failed to update SSO provider');
      setSubmitting(false);
    }
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
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
            <p style={{ marginTop: '1rem', color: '#666' }}>Loading provider...</p>
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
            &larr;
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            Edit SSO Provider
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
          {/* Protocol Display (read-only) */}
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              Protocol
            </h2>
            <div style={{
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{
                background: protocol === 'SAML2' ? '#3b82f6' : '#10b981',
                color: '#fff',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}>
                {protocol === 'SAML2' ? 'SAML 2.0' : 'OpenID Connect'}
              </span>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>
                Protocol cannot be changed after creation
              </span>
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
              Basic Configuration
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
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
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
                    background: '#fff',
                    boxSizing: 'border-box'
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
                SAML Configuration
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
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
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
                    placeholder="e.g., https://dev-123456.okta.com/app/.../sso/saml"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    X.509 Certificate
                  </label>
                  <textarea
                    value={formData.samlCertificate || ''}
                    onChange={(e) => {
                      updateField('samlCertificate', e.target.value);
                      setCertModified(true);
                    }}
                    placeholder={certModified ? '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----' : 'Leave empty to keep existing certificate'}
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                    {certModified
                      ? 'New certificate will be saved'
                      : 'Existing certificate is stored securely. Only fill to replace it.'}
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
                    placeholder="e.g., https://dev-123456.okta.com/app/.../sso/saml/metadata"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
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
                OIDC Configuration
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
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
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
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Client Secret
                  </label>
                  <input
                    type="password"
                    value={formData.oidcClientSecret || ''}
                    onChange={(e) => {
                      updateField('oidcClientSecret', e.target.value);
                      setSecretModified(true);
                    }}
                    placeholder={secretModified ? 'Enter new client secret' : 'Leave empty to keep existing secret'}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                    {secretModified
                      ? 'New secret will be saved'
                      : 'Existing secret is stored securely. Only fill to replace it.'}
                  </div>
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
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
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
              Security Settings
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
                            &times;
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
