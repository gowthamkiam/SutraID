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
};
