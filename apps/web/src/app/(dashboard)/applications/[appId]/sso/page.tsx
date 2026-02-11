'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Application {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  samlIdpEnabled: boolean;
  samlSpEntityId?: string;
  samlSpAcsUrl?: string;
  samlNameIdFormat?: string;
  samlAttributeMapping?: Record<string, string>;
  oidcIdpEnabled: boolean;
  oidcScopes: string[];
}

const nameIdFormats = [
  {
    value: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    label: 'Email Address',
  },
  {
    value: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
    label: 'Persistent (UUID)',
  },
  {
    value: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    label: 'Transient (Session)',
  },
  {
    value: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
    label: 'Unspecified',
  },
];

const defaultScopes = ['openid', 'profile', 'email'];
const availableScopes = [
  { value: 'openid', label: 'OpenID Connect', description: 'Required for OIDC' },
  { value: 'profile', label: 'Profile', description: 'Name, picture, etc.' },
  { value: 'email', label: 'Email', description: 'Email address' },
  { value: 'phone', label: 'Phone', description: 'Phone number' },
  { value: 'address', label: 'Address', description: 'Physical address' },
  {
    value: 'offline_access',
    label: 'Offline Access',
    description: 'Refresh tokens',
  },
];

export default function ApplicationSsoPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active tab: 'saml' or 'oidc'
  const [activeTab, setActiveTab] = useState<'saml' | 'oidc'>('saml');

  // Get current org ID
  const [orgId, setOrgId] = useState<string>('');

  useEffect(() => {
    const storedOrgId = localStorage.getItem('currentOrgId');
    if (storedOrgId) {
      setOrgId(storedOrgId);
    }
  }, []);

  useEffect(() => {
    if (!orgId || !appId) return;

    // Fetch application details
    const fetchApplication = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/organizations/${orgId}/applications/${appId}`,
          {
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error('Failed to fetch application');
        }

        const data = await response.json();
        setApplication(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load application');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [orgId, appId]);

  const handleSamlToggle = async () => {
    if (!application || !orgId) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/organizations/${orgId}/applications/${appId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            samlIdpEnabled: !application.samlIdpEnabled,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update SAML IDP settings');
      }

      const updated = await response.json();
      setApplication(updated);
      setSuccessMessage('SAML IDP settings updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSamlSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !orgId) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/organizations/${orgId}/applications/${appId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            samlSpEntityId: formData.get('samlSpEntityId'),
            samlSpAcsUrl: formData.get('samlSpAcsUrl'),
            samlNameIdFormat:
              formData.get('samlNameIdFormat') ||
              'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to save SAML configuration');
      }

      const updated = await response.json();
      setApplication(updated);
      setSuccessMessage('SAML configuration saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleOidcToggle = async () => {
    if (!application || !orgId) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/organizations/${orgId}/applications/${appId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            oidcIdpEnabled: !application.oidcIdpEnabled,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update OIDC IDP settings');
      }

      const updated = await response.json();
      setApplication(updated);
      setSuccessMessage('OIDC IDP settings updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleOidcScopesUpdate = async (scopes: string[]) => {
    if (!application || !orgId) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/organizations/${orgId}/applications/${appId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: JSON.stringify({
            oidcScopes: scopes,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update OIDC scopes');
      }

      const updated = await response.json();
      setApplication(updated);
      setSuccessMessage('OIDC scopes updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update scopes');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Copied to clipboard');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--color-border)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div style={{ padding: '24px' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--color-error-light)',
            borderRadius: '8px',
            color: 'var(--color-error)',
          }}
        >
          {error || 'Application not found'}
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const samlMetadataUrl = `${baseUrl}/api/v1/sso/saml-idp/${orgId}/metadata`;
  const samlSsoUrl = `${baseUrl}/api/v1/sso/saml-idp/${orgId}/sso`;
  const oidcDiscoveryUrl = `${baseUrl}/api/v1/sso/oidc-idp/${orgId}/.well-known/openid-configuration`;
  const oidcIssuer = `${baseUrl}/api/v1/sso/oidc-idp/${orgId}`;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← Back
        </button>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '8px',
          }}
        >
          SSO Configuration
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>
          Configure {application.name} to use SutraID as an identity provider
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--color-success-light)',
            borderRadius: '8px',
            color: 'var(--color-success)',
            marginBottom: '24px',
          }}
        >
          {successMessage}
        </div>
      )}
      {error && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--color-error-light)',
            borderRadius: '8px',
            color: 'var(--color-error)',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('saml')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom:
                activeTab === 'saml'
                  ? '2px solid var(--color-primary)'
                  : '2px solid transparent',
              color:
                activeTab === 'saml'
                  ? 'var(--color-primary)'
                  : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'saml' ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            SAML 2.0
          </button>
          <button
            onClick={() => setActiveTab('oidc')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom:
                activeTab === 'oidc'
                  ? '2px solid var(--color-primary)'
                  : '2px solid transparent',
              color:
                activeTab === 'oidc'
                  ? 'var(--color-primary)'
                  : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'oidc' ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            OpenID Connect
          </button>
        </div>
      </div>

      {/* SAML Configuration */}
      {activeTab === 'saml' && (
        <div>
          {/* Enable Toggle */}
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '12px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '4px',
                  }}
                >
                  Enable SAML Identity Provider
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  Allow this application to use SutraID as a SAML 2.0 identity
                  provider
                </p>
              </div>
              <button
                onClick={handleSamlToggle}
                disabled={saving}
                style={{
                  padding: '8px 24px',
                  backgroundColor: application.samlIdpEnabled
                    ? 'var(--color-error)'
                    : 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {application.samlIdpEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>

          {application.samlIdpEnabled && (
            <>
              {/* SAML Metadata */}
              <div
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: '12px',
                  marginBottom: '24px',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '16px',
                  }}
                >
                  SutraID SAML Metadata
                </h3>
                <p
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '14px',
                    marginBottom: '16px',
                  }}
                >
                  Configure your Service Provider with these SutraID SAML IDP
                  settings:
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '8px',
                    }}
                  >
                    Metadata URL
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={samlMetadataUrl}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-background)',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      onClick={() => copyToClipboard(samlMetadataUrl)}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '8px',
                    }}
                  >
                    SSO URL (Redirect & POST Binding)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={samlSsoUrl}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-background)',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      onClick={() => copyToClipboard(samlSsoUrl)}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* SP Configuration */}
              <div
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: '12px',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '16px',
                  }}
                >
                  Service Provider Settings
                </h3>
                <p
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '14px',
                    marginBottom: '16px',
                  }}
                >
                  Enter your Service Provider's SAML configuration:
                </p>

                <form onSubmit={handleSamlSave}>
                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--color-text-secondary)',
                        marginBottom: '8px',
                      }}
                    >
                      SP Entity ID *
                    </label>
                    <input
                      type="text"
                      name="samlSpEntityId"
                      defaultValue={application.samlSpEntityId || ''}
                      required
                      placeholder="https://your-sp.example.com/saml/metadata"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--color-text-secondary)',
                        marginBottom: '8px',
                      }}
                    >
                      Assertion Consumer Service (ACS) URL *
                    </label>
                    <input
                      type="url"
                      name="samlSpAcsUrl"
                      defaultValue={application.samlSpAcsUrl || ''}
                      required
                      placeholder="https://your-sp.example.com/saml/acs"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--color-text-secondary)',
                        marginBottom: '8px',
                      }}
                    >
                      NameID Format
                    </label>
                    <select
                      name="samlNameIdFormat"
                      defaultValue={
                        application.samlNameIdFormat ||
                        'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
                      }
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'var(--color-surface)',
                      }}
                    >
                      {nameIdFormats.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 500,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* OIDC Configuration */}
      {activeTab === 'oidc' && (
        <div>
          {/* Enable Toggle */}
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '12px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '4px',
                  }}
                >
                  Enable OpenID Connect
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  Allow this application to use SutraID as an OIDC identity
                  provider
                </p>
              </div>
              <button
                onClick={handleOidcToggle}
                disabled={saving}
                style={{
                  padding: '8px 24px',
                  backgroundColor: application.oidcIdpEnabled
                    ? 'var(--color-error)'
                    : 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {application.oidcIdpEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>

          {application.oidcIdpEnabled && (
            <>
              {/* OIDC Metadata */}
              <div
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: '12px',
                  marginBottom: '24px',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '16px',
                  }}
                >
                  SutraID OIDC Configuration
                </h3>
                <p
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '14px',
                    marginBottom: '16px',
                  }}
                >
                  Configure your application with these SutraID OIDC settings:
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '8px',
                    }}
                  >
                    Issuer
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={oidcIssuer}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-background)',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      onClick={() => copyToClipboard(oidcIssuer)}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '8px',
                    }}
                  >
                    Discovery Document
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={oidcDiscoveryUrl}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-background)',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      onClick={() => copyToClipboard(oidcDiscoveryUrl)}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '8px',
                    }}
                  >
                    Client ID
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={application.clientId}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-background)',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      onClick={() => copyToClipboard(application.clientId)}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '8px',
                    }}
                  >
                    Client Secret
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="password"
                      value={application.clientSecret}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-background)',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                      }}
                    />
                    <button
                      onClick={() => copyToClipboard(application.clientSecret)}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Scopes */}
              <div
                style={{
                  padding: '24px',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: '12px',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '16px',
                  }}
                >
                  Allowed Scopes
                </h3>
                <p
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '14px',
                    marginBottom: '16px',
                  }}
                >
                  Select which scopes this application can request:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {availableScopes.map((scope) => {
                    const isSelected = (
                      application.oidcScopes || defaultScopes
                    ).includes(scope.value);
                    return (
                      <label
                        key={scope.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: isSelected
                            ? 'var(--color-primary-light)'
                            : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={scope.value === 'openid'} // openid is required
                          onChange={(e) => {
                            const currentScopes =
                              application.oidcScopes || defaultScopes;
                            const newScopes = e.target.checked
                              ? [...currentScopes, scope.value]
                              : currentScopes.filter((s) => s !== scope.value);
                            handleOidcScopesUpdate(newScopes);
                          }}
                          style={{ marginRight: '12px' }}
                        />
                        <div>
                          <div
                            style={{
                              fontWeight: 500,
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {scope.label}
                            {scope.value === 'openid' && ' (Required)'}
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            {scope.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
