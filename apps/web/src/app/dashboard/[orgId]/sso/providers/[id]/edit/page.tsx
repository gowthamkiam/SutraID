'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ssoApi, SsoProvider, CreateSsoProviderDto } from '@/lib/api';
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
  ShieldAlert,
  Save,
  Clock
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

  const [certModified, setCertModified] = useState(false);
  const [secretModified, setSecretModified] = useState(false);
  const orgId = params.orgId as string;

  useEffect(() => {
    if (orgId) loadProvider();
  }, [providerId, orgId]);

  const loadProvider = async () => {
    if (!orgId) return;
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
    if (!orgId) { setError('Organization not found.'); return; }
    setError(null);
    setSubmitting(true);

    try {
      const updateData: Partial<CreateSsoProviderDto> = {
        name: formData.name,
        type: formData.type,
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
      router.push(`/dashboard/${orgId}/sso/providers`);
    } catch (err: any) {
      setError(err.message || 'Failed to update provider');
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--accent-light)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back Button & Title */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => router.push(`/dashboard/${orgId}/sso/providers`)}
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
          }}
        >
          <ArrowLeft size={16} />
          Back to Providers
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, letterSpacing: '-0.025em' }}>
            Edit Provider
          </h1>
          <span style={{
            background: protocol === 'SAML2' ? 'var(--accent-light)' : 'rgba(16, 185, 129, 0.1)',
            color: protocol === 'SAML2' ? 'var(--accent-primary)' : '#10b981',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '700',
            marginTop: '4px',
          }}>
            {protocol === 'SAML2' ? 'SAML 2.0' : 'OpenID Connect'}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={20} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <FormSection title="Provider Identity" icon={Settings}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Display Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Okta Workforce"
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Integration Type <span style={{ color: '#ef4444' }}>*</span></label>
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
                    <option value="AZURE_AD">Microsoft Entra ID</option>
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
          <FormSection title="SAML Configuration" icon={Link}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>IdP Entity ID <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  required
                  value={formData.samlEntityId || ''}
                  onChange={(e) => updateField('samlEntityId', e.target.value)}
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={labelStyle}>IdP Single Sign-On URL <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="url"
                  required
                  value={formData.samlSsoUrl || ''}
                  onChange={(e) => updateField('samlSsoUrl', e.target.value)}
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Public X.509 Certificate</label>
                <textarea
                  value={formData.samlCertificate || ''}
                  onChange={(e) => {
                    updateField('samlCertificate', e.target.value);
                    setCertModified(true);
                  }}
                  placeholder={certModified ? '-----BEGIN CERTIFICATE-----\n...' : 'Leave empty to keep existing certificate'}
                  rows={6}
                  style={{ ...inputStyle, fontFamily: 'monospace', height: '140px', resize: 'vertical', fontSize: '0.8rem' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                  <Clock size={14} />
                  <span>{certModified ? 'New certificate will replace the existing one.' : 'Existing certificate is hidden for security.'}</span>
                </div>
              </div>
            </div>
          </FormSection>
        ) : (
          <FormSection title="OIDC Client Configuration" icon={Lock}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Issuer URL <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="url"
                  required
                  value={formData.oidcIssuer || ''}
                  onChange={(e) => updateField('oidcIssuer', e.target.value)}
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={labelStyle}>Client ID <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.oidcClientId || ''}
                    onChange={(e) => updateField('oidcClientId', e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Client Secret</label>
                  <input
                    type="password"
                    value={formData.oidcClientSecret || ''}
                    onChange={(e) => {
                      updateField('oidcClientSecret', e.target.value);
                      setSecretModified(true);
                    }}
                    placeholder={secretModified ? 'New secret' : '••••••••••••'}
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Scopes</label>
                <input
                  type="text"
                  value={(formData.oidcScopes || []).join(' ')}
                  onChange={(e) => updateField('oidcScopes', e.target.value.split(' '))}
                  style={{ ...inputStyle, fontFamily: 'monospace' }}
                />
              </div>
            </div>
          </FormSection>
        )}

        <FormSection title="Security & Policies" icon={ShieldCheck}>
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
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Active Provider</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Users can sign in using this provider.
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
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Auto-Provision</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Create users on first successful login.
                  </div>
                </div>
              </label>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <label style={labelStyle}>Domain Restrictions</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
                {(formData.allowedDomains || []).length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '12px', border: '1px dashed var(--border-color)', borderRadius: '12px', width: '100%', textAlign: 'center' }}>
                    No domains restricted.
                  </div>
                ) : (
                  formData.allowedDomains?.map(domain => (
                    <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg-badge)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                      {domain}
                      <button type="button" onClick={() => removeAllowedDomain(domain)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--text-tertiary)' }}>
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
                  display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-badge)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Add Domain
              </button>
            </div>
          </div>
        </FormSection>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '2rem', marginBottom: '5rem' }}>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${orgId}/sso/providers`)}
            style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}
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
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {submitting ? 'Saving...' : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.9rem',
  fontWeight: '600',
  marginBottom: '0.75rem',
  color: 'var(--text-secondary)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-input)',
  borderRadius: '10px',
  fontSize: '0.95rem',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'all 0.2s',
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
