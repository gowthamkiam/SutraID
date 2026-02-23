'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ssoApi, CreateSsoProviderDto } from '@/lib/api';
import {
  ShieldCheck,
  Globe,
  Settings,
  Lock,
  ArrowLeft,
  Info,
  CheckCircle2,
  Plus,
  X,
  FileCode,
  Link,
  ShieldAlert
} from 'lucide-react';

type ProviderType = 'OKTA' | 'AZURE_AD' | 'GOOGLE_WORKSPACE' | 'GENERIC_SAML' | 'GENERIC_OIDC';
type Protocol = 'SAML2' | 'OIDC';

interface FormSectionProps {
  title: string;
  icon: any;
  children: React.ReactNode;
}

function FormSection({ title, icon: Icon, children }: FormSectionProps) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '1.5rem',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'var(--accent-light)',
          color: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={20} />
        </div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

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
    if (!orgId) {
      setError('No organization found. Please complete onboarding first.');
      return;
    }
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
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back Button & Title */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => router.push('/dashboard/sso/providers')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '4px 0',
            marginBottom: '1rem',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <ArrowLeft size={16} />
          Back to Providers
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, letterSpacing: '-0.025em' }}>
          Configure SSO Provider
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Connect your enterprise identity provider to enable single sign-on.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.95rem',
        }}>
          <ShieldAlert size={20} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Protocol Selection as Premium Cards */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>1</span>
            <h2 style={{ fontSize: '1rem', fontWeight: '750', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Choose Authentication Protocol
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem' }}>
            {[
              { id: 'SAML2', name: 'SAML 2.0', icon: ShieldCheck, desc: 'Enterprise standard for broad compatibility with IdPs like Okta and Azure AD.' },
              { id: 'OIDC', name: 'OpenID Connect', icon: Globe, desc: 'Modern OAuth 2.0 based protocol ideal for cloud-native providers.' }
            ].map((p) => {
              const Icon = p.icon;
              const isSelected = protocol === p.id;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProtocolChange(p.id as Protocol)}
                  style={{
                    flex: 1,
                    padding: '2rem',
                    textAlign: 'left',
                    background: isSelected ? 'var(--accent-light)' : 'var(--bg-card)',
                    border: '2px solid ' + (isSelected ? 'var(--accent-primary)' : 'var(--border-color)'),
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--text-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: isSelected ? 'var(--accent-primary)' : 'var(--bg-badge)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    transition: 'all 0.3s'
                  }}>
                    <Icon size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 8px', color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)' }}>
                    {p.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: 0, color: 'var(--text-secondary)' }}>
                    {p.desc}
                  </p>

                  {isSelected && (
                    <div style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--accent-primary)' }}>
                      <CheckCircle2 size={24} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Configuration Sections */}
        <FormSection title="Identity Provider Details" icon={Settings}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                Display Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Workforce Identity (Okta)"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                Integration Type <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => updateField('type', e.target.value)}
                style={selectStyle}
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
                    <option value="AZURE_AD">Microsoft Entra ID</option>
                    <option value="GOOGLE_WORKSPACE">Google Workspace</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </FormSection>

        {protocol === 'SAML2' ? (
          <FormSection title="SAML Endpoint Configuration" icon={Link}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                  IdP Entity ID <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    value={formData.samlEntityId || ''}
                    onChange={(e) => updateField('samlEntityId', e.target.value)}
                    placeholder="urn:oasis:names:tc:SAML:2.0:issuer"
                    style={{ ...inputStyle, paddingLeft: '2.75rem', fontFamily: 'monospace' }}
                  />
                  <Globe size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-tertiary)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                  IdP Single Sign-On URL <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.samlSsoUrl || ''}
                  onChange={(e) => updateField('samlSsoUrl', e.target.value)}
                  placeholder="https://idp.example.com/sso/saml"
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                  Public X.509 Certificate <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  required
                  value={formData.samlCertificate || ''}
                  onChange={(e) => updateField('samlCertificate', e.target.value)}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  rows={8}
                  style={{ ...inputStyle, fontFamily: 'monospace', height: '160px', resize: 'vertical', fontSize: '0.8rem' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                  <Info size={14} />
                  <span>Paste the full PEM-encoded signing certificate from your IdP.</span>
                </div>
              </div>
            </div>
          </FormSection>
        ) : (
          <FormSection title="OIDC Client Credentials" icon={Lock}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                  Issuer URL <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.oidcIssuer || ''}
                  onChange={(e) => updateField('oidcIssuer', e.target.value)}
                  placeholder="https://accounts.google.com"
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                    Client ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.oidcClientId || ''}
                    onChange={(e) => updateField('oidcClientId', e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                    Client Secret <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.oidcClientSecret || ''}
                    onChange={(e) => updateField('oidcClientSecret', e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                  Requested Scopes
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={(formData.oidcScopes || []).join(' ')}
                    onChange={(e) => updateField('oidcScopes', e.target.value.split(' '))}
                    style={{ ...inputStyle, paddingLeft: '2.75rem', fontFamily: 'monospace' }}
                  />
                  <FileCode size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-tertiary)' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {['openid', 'profile', 'email'].map(s => (
                    <span key={s} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-badge)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>
        )}

        <FormSection title="Access Control & Provisioning" icon={ShieldCheck}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <label style={{ display: 'flex', gap: '12px', cursor: 'pointer', flex: 1 }}>
                <div style={{ paddingTop: '2px' }}>
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => updateField('enabled', e.target.checked)}
                    style={checkboxStyle}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Enable Provider</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Instantly make this auth method available to users.
                  </div>
                </div>
              </label>

              <label style={{ display: 'flex', gap: '12px', cursor: 'pointer', flex: 1 }}>
                <div style={{ paddingTop: '2px' }}>
                  <input
                    type="checkbox"
                    checked={formData.autoProvision}
                    onChange={(e) => updateField('autoProvision', e.target.checked)}
                    style={checkboxStyle}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Just-in-Time Provisioning</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Create new users automatically on their first successful login.
                  </div>
                </div>
              </label>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem' }}>
                Allowed Email Domains
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
                {(formData.allowedDomains || []).length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '12px', border: '1px dashed var(--border-color)', borderRadius: '12px', width: '100%', textAlign: 'center' }}>
                    No restrictions. Users from any email domain can authenticate.
                  </div>
                ) : (
                  formData.allowedDomains?.map(domain => (
                    <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg-badge)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                      {domain}
                      <button type="button" onClick={() => removeAllowedDomain(domain)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--text-tertiary)' }} onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={addAllowedDomain}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-badge)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-badge)'}
              >
                <Plus size={16} />
                Add domain restriction
              </button>
            </div>
          </div>
        </FormSection>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          paddingTop: '2rem',
          borderTop: '1px solid var(--border-color)',
          marginTop: '1rem',
          marginBottom: '5rem',
        }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard/sso/providers')}
            disabled={submitting}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              opacity: submitting ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 32px',
              background: 'var(--btn-primary-bg)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              transition: 'transform 0.2s',
              opacity: submitting ? 0.8 : 1,
            }}
            onMouseEnter={e => !submitting && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => !submitting && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {submitting ? 'Setting up...' : 'Create Provider'}
          </button>
        </div>
      </form>

      <style jsx global>{`
        input::placeholder, textarea::placeholder {
          color: var(--text-tertiary);
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-input)',
  borderRadius: '10px',
  fontSize: '0.95rem',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '16px',
  paddingRight: '40px',
};

const checkboxStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: '6px',
  border: '2px solid var(--border-input)',
  cursor: 'pointer',
  accentColor: 'var(--accent-primary)',
};
