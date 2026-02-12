// API client utilities
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface SsoProvider {
  id: string;
  organizationId: string;
  name: string;
  type: 'OKTA' | 'AZURE_AD' | 'GOOGLE_WORKSPACE' | 'GENERIC_SAML' | 'GENERIC_OIDC';
  protocol: 'SAML2' | 'OIDC';
  enabled: boolean;
  autoProvision: boolean;
  allowedDomains: string[];

  // SAML fields
  samlEntityId?: string;
  samlSsoUrl?: string;
  samlMetadataUrl?: string;

  // OIDC fields
  oidcIssuer?: string;
  oidcClientId?: string;
  oidcScopes?: string[];

  attributeMapping: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSsoProviderDto {
  name: string;
  type: SsoProvider['type'];
  protocol: SsoProvider['protocol'];
  enabled?: boolean;
  autoProvision?: boolean;
  allowedDomains?: string[];

  // SAML
  samlEntityId?: string;
  samlSsoUrl?: string;
  samlCertificate?: string;
  samlMetadataUrl?: string;

  // OIDC
  oidcIssuer?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcAuthUrl?: string;
  oidcTokenUrl?: string;
  oidcUserinfoUrl?: string;
  oidcScopes?: string[];

  attributeMapping?: Record<string, string>;
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const ssoApi = {
  // List all SSO providers for an organization
  async listProviders(orgId: string): Promise<SsoProvider[]> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/sso/providers`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch SSO providers');
    }

    return response.json();
  },

  // Get a single SSO provider
  async getProvider(orgId: string, providerId: string): Promise<SsoProvider> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/sso/providers/${providerId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch SSO provider');
    }

    return response.json();
  },

  // Create a new SSO provider
  async createProvider(orgId: string, data: CreateSsoProviderDto): Promise<SsoProvider> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/sso/providers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create SSO provider');
    }

    return response.json();
  },

  // Update an SSO provider
  async updateProvider(orgId: string, providerId: string, data: Partial<CreateSsoProviderDto>): Promise<SsoProvider> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/sso/providers/${providerId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update SSO provider');
    }

    return response.json();
  },

  // Delete an SSO provider
  async deleteProvider(orgId: string, providerId: string): Promise<void> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/sso/providers/${providerId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete SSO provider');
    }
  },

  // Get SAML metadata URL for a provider
  getSamlMetadataUrl(orgId: string): string {
    return `${API_URL}/sso/saml/${orgId}/metadata`;
  },

  // Get SAML login URL
  getSamlLoginUrl(orgId: string, providerId: string): string {
    return `${API_URL}/sso/saml/${orgId}/login?providerId=${providerId}`;
  },

  // Get OIDC login URL
  getOidcLoginUrl(providerId: string): string {
    return `${API_URL}/sso/oidc/${providerId}/login`;
  },

  // Discover SSO providers by email domain (public, no auth needed)
  async discoverProviders(domain: string): Promise<{ providers: Array<{ id: string; name: string; type: string; protocol: string; organizationId: string }> }> {
    const response = await fetch(`${API_URL}/sso/discover?domain=${encodeURIComponent(domain)}`);

    if (!response.ok) {
      throw new Error('Failed to discover SSO providers');
    }

    return response.json();
  },

  // Test SSO provider connection
  async testConnection(orgId: string, providerId: string): Promise<{ success: boolean; checks: Array<{ name: string; passed: boolean; message: string }> }> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/sso/providers/${providerId}/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to test connection');
    }

    return response.json();
  },
};

// ============================================================================
// Application API (Phase 3 - Identity Provider)
// ============================================================================

export type AppType = 'WEB' | 'SPA' | 'NATIVE_MOBILE' | 'NATIVE_DESKTOP' | 'M2M';
export type AppStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';

export interface Application {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  clientId: string;
  redirectUris: string[];
  allowedOrigins: string[];
  type: AppType;
  status: AppStatus;
  // SAML IdP
  samlIdpEnabled: boolean;
  samlSpEntityId?: string;
  samlSpAcsUrl?: string;
  samlNameIdFormat?: string;
  samlAttributeMapping?: Record<string, string>;
  // OIDC IdP
  oidcIdpEnabled: boolean;
  oidcScopes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationDto {
  name: string;
  description?: string;
  logoUrl?: string;
  redirectUris: string[];
  allowedOrigins?: string[];
  type: AppType;
  // SAML IdP
  samlIdpEnabled?: boolean;
  samlSpEntityId?: string;
  samlSpAcsUrl?: string;
  samlNameIdFormat?: string;
  samlAttributeMapping?: Record<string, string>;
  // OIDC IdP
  oidcIdpEnabled?: boolean;
  oidcScopes?: string[];
}

export const applicationApi = {
  async list(orgId: string): Promise<Application[]> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/applications`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch applications');
    return response.json();
  },

  async get(orgId: string, appId: string): Promise<Application> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/applications/${appId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch application');
    return response.json();
  },

  async create(orgId: string, data: CreateApplicationDto): Promise<Application & { clientSecret: string }> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/applications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create application');
    }
    return response.json();
  },

  async update(orgId: string, appId: string, data: Partial<CreateApplicationDto>): Promise<Application> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/applications/${appId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update application');
    }
    return response.json();
  },

  async rotateSecret(orgId: string, appId: string): Promise<{ clientId: string; clientSecret: string; message: string }> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/applications/${appId}/rotate-secret`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to rotate secret');
    return response.json();
  },

  async remove(orgId: string, appId: string): Promise<void> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/applications/${appId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete application');
  },

  async getIdpMetadata(orgId: string, appId: string): Promise<string> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/applications/${appId}/idp-metadata`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch IdP metadata');
    return response.text();
  },

  getIdpMetadataUrl(orgId: string, appId: string): string {
    return `${API_URL}/organizations/${orgId}/applications/${appId}/idp-metadata`;
  },

  getSamlIdpSsoUrl(orgId: string): string {
    return `${API_URL}/sso/saml-idp/${orgId}/sso`;
  },

  getSamlIdpMetadataUrl(orgId: string): string {
    return `${API_URL}/sso/saml-idp/${orgId}/metadata`;
  },

  getOidcIdpDiscoveryUrl(orgId: string): string {
    return `${API_URL}/sso/oidc-idp/${orgId}/.well-known/openid-configuration`;
  },

  getOidcIdpAuthorizeUrl(orgId: string): string {
    return `${API_URL}/sso/oidc-idp/${orgId}/authorize`;
  },

  getOidcIdpTokenUrl(orgId: string): string {
    return `${API_URL}/sso/oidc-idp/${orgId}/token`;
  },

  getOidcIdpJwksUrl(orgId: string): string {
    return `${API_URL}/sso/oidc-idp/${orgId}/jwks`;
  },
};
