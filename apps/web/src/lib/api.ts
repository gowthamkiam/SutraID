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

export type ApplicationProtocol = 'OIDC' | 'SAML';
export type AppStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';

export interface Application {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  type: ApplicationProtocol;
  clientId?: string;
  redirectUris: string[];
  grantTypes: string[];
  responseTypes: string[];
  scopes: string[];
  tokenEndpointAuthMethod: string;
  isPublicClient: boolean;
  requireDpop: boolean;
  jwks?: any;
  dpopNonceEnabled: boolean;
  isAiAgent: boolean;
  // Grant type controls
  allowROPC: boolean;
  allowClientCredentials: boolean;
  allowRefreshForROPC: boolean;
  pkceRequired: boolean;
  // SAML
  samlEntityId?: string;
  samlCertificate?: string;
  samlSpEntityId?: string;
  samlSpAcsUrl?: string;
  samlNameIdFormat?: string;
  samlAttributeMapping?: Record<string, any>;
  // Metadata
  status: AppStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationDto {
  name: string;
  description?: string;
  logoUrl?: string;
  type: ApplicationProtocol;
  redirectUris?: string[];
  grantTypes?: string[];
  responseTypes?: string[];
  scopes?: string[];
  tokenEndpointAuthMethod?: string;
  isPublicClient?: boolean;
  requireDpop?: boolean;
  jwks?: any;
  dpopNonceEnabled?: boolean;
  isAiAgent?: boolean;
  // Grant type controls
  allowROPC?: boolean;
  allowClientCredentials?: boolean;
  allowRefreshForROPC?: boolean;
  pkceRequired?: boolean;
  // SAML
  samlEntityId?: string;
  samlSpEntityId?: string;
  samlSpAcsUrl?: string;
  samlNameIdFormat?: string;
  samlAttributeMapping?: Record<string, any>;
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

  async create(orgId: string, data: CreateApplicationDto): Promise<Application & { clientSecret?: string }> {
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

  async setUsers(orgId: string, appId: string, userIds: string[]): Promise<{ success: boolean; userIds: string[] }> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/applications/${appId}/users`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userIds }),
    });
    if (!response.ok) throw new Error('Failed to assign users to application');
    return response.json();
  },

  async setGroups(orgId: string, appId: string, groupIds: string[]): Promise<{ success: boolean; groupIds: string[] }> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/applications/${appId}/groups`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ groupIds }),
    });
    if (!response.ok) throw new Error('Failed to assign groups to application');
    return response.json();
  },

  // SAML endpoints
  getSamlMetadataUrl(orgId: string, appId: string): string {
    return `${API_URL.replace('/api/v1', '')}/saml/${orgId}/${appId}/metadata.xml`;
  },

  getSamlSsoUrl(orgId: string, appId: string): string {
    return `${API_URL.replace('/api/v1', '')}/saml/${orgId}/${appId}/sso`;
  },

  // OIDC endpoints
  getOidcDiscoveryUrl(orgId: string, appId: string): string {
    return `${API_URL}/sso/oidc-idp/${orgId}/${appId}/.well-known/openid-configuration`;
  },

  getTokenUrl(orgId: string, appId: string): string {
    return `${API_URL}/sso/oidc-idp/${orgId}/${appId}/oauth/token`;
  },

  getIntrospectUrl(orgId: string, appId: string): string {
    return `${API_URL}/sso/oidc-idp/${orgId}/${appId}/oauth/introspect`;
  },

  getRevokeUrl(orgId: string, appId: string): string {
    return `${API_URL}/sso/oidc-idp/${orgId}/${appId}/oauth/revoke`;
  },

  getDcrUrl(orgId: string, appId: string): string {
    return `${API_URL}/sso/oidc-idp/${orgId}/${appId}/oauth/register`;
  },

  getAuthorizeUrl(orgId: string, appId: string): string {
    return `${API_URL}/sso/oidc-idp/${orgId}/${appId}/authorize`;
  },

  // Guide
  getGuideUrl(orgSlug: string, appId: string): string {
    return `${API_URL.replace('/api/v1', '')}/guide/${orgSlug}/${appId}`;
  },
};

// ============================================================================
// Audit API
// ============================================================================

export interface AuditLogEntry {
  id: string;
  organizationId: string | null;
  userId: string | null;
  agentId: string | null;
  action: string;
  resource: string | null;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata: Record<string, any>;
  riskScore: number | null;
  createdAt: string;
}

export interface AuditQueryResult {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const auditApi = {
  async getLogs(orgId: string, params?: {
    userId?: string;
    action?: string;
    result?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditQueryResult> {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.action) searchParams.set('action', params.action);
    if (params?.result) searchParams.set('result', params.result);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const response = await fetch(
      `${API_URL}/organizations/${orgId}/audit/logs?${searchParams.toString()}`,
      { headers: getAuthHeaders() },
    );
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
  },

  async getStats(orgId: string, days?: number): Promise<any> {
    const params = days ? `?days=${days}` : '';
    const response = await fetch(
      `${API_URL}/organizations/${orgId}/audit/stats${params}`,
      { headers: getAuthHeaders() },
    );
    if (!response.ok) throw new Error('Failed to fetch audit stats');
    return response.json();
  },
};

// ============================================================================
// Policy API
// ============================================================================

export interface Policy {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  effect: 'ALLOW' | 'DENY';
  resource: string;
  actions: string[];
  conditions: Record<string, any>;
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyDto {
  name: string;
  description?: string;
  effect?: 'ALLOW' | 'DENY';
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
  priority?: number;
  enabled?: boolean;
}

export interface EvaluationResult {
  decision: 'ALLOW' | 'DENY';
  matchedPolicy?: { id: string; name: string; effect: string; priority: number };
  reason: string;
}

export const policyApi = {
  async list(orgId: string): Promise<Policy[]> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/policies`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch policies');
    return response.json();
  },

  async get(orgId: string, policyId: string): Promise<Policy> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/policies/${policyId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch policy');
    return response.json();
  },

  async create(orgId: string, data: CreatePolicyDto): Promise<Policy> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/policies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create policy');
    }
    return response.json();
  },

  async update(orgId: string, policyId: string, data: Partial<CreatePolicyDto>): Promise<Policy> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/policies/${policyId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update policy');
    }
    return response.json();
  },

  async delete(orgId: string, policyId: string): Promise<void> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/policies/${policyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete policy');
  },

  async listByType(orgId: string, type: string): Promise<Policy[]> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/policies?type=${type}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch policies');
    return response.json();
  },

  async evaluate(orgId: string, data: {
    userId?: string;
    agentId?: string;
    resource: string;
    action: string;
    context?: Record<string, any>;
    riskContext?: {
      ipAddress?: string;
      userAgent?: string;
      deviceId?: string;
      location?: string;
    };
  }): Promise<EvaluationResult> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/policies/evaluate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to evaluate policy');
    return response.json();
  },
};

export const passwordPolicyApi = {
  async get(orgId: string): Promise<any> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/policies/password`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch password policy');
    return response.json();
  },

  async update(orgId: string, data: any): Promise<any> {
    const response = await fetch(`${API_URL}/organizations/${orgId}/policies/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update password policy');
    return response.json();
  },
};

// ============================================================================
// MFA API (Phase 6)
// ============================================================================

export interface MfaMethod {
  id: string;
  type: 'TOTP' | 'PASSKEY' | 'MAGIC_LINK' | 'OTP_EMAIL' | 'OTP_SMS' | 'FIDO2';
  name: string;
  verified: boolean;
  lastUsedAt: string | null;
  isPhishingResistant: boolean;
}

export interface MfaStatus {
  enabled: boolean;
  methods: MfaMethod[];
  adaptiveAuthEnabled: boolean;
}

export interface EnrollTotpResponse {
  methodId: string;
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export const mfaApi = {
  async getStatus(): Promise<MfaStatus> {
    const response = await fetch(`${API_URL}/auth/mfa/status`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch MFA status');
    return response.json();
  },

  async enrollTotp(): Promise<EnrollTotpResponse> {
    const response = await fetch(`${API_URL}/auth/mfa/enroll/totp`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to start MFA enrollment');
    return response.json();
  },

  async verifyEnrollment(methodId: string, code: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/auth/mfa/enroll/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ methodId, code }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Invalid verification code');
    }
    return response.json();
  },

  // Passkey / WebAuthn Methods
  async getPasskeyOptions(): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const response = await fetch(`${API_URL}/auth/passkey/options`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch Passkey options');
    return response.json();
  },

  async enrollPasskey(credential: any): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/auth/passkey/enroll`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ credential }),
    });
    if (!response.ok) throw new Error('Failed to enroll Passkey');
    return response.json();
  },

  // Magic Link / OTP
  async sendMagicLink(email: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/magic-link/send`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error('Failed to send magic link');
  },

  async sendOtp(email: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/otp/send`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error('Failed to send OTP');
  },

  // Adaptive Auth
  async checkRisk(context: any): Promise<{ riskScore: number; recommendation: 'ALLOW' | 'CHALLENGE' | 'DENY' }> {
    const response = await fetch(`${API_URL}/auth/adaptive/check`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(context),
    });
    if (!response.ok) throw new Error('Failed to check risk');
    return response.json();
  },

  async disable(password: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/auth/mfa/disable`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to disable MFA');
    }
    return response.json();
  },

  async updateAdaptiveAuth(enabled: boolean): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/auth/mfa/adaptive/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ enabled }),
    });
    if (!response.ok) throw new Error('Failed to update adaptive auth');
    return response.json();
  },
};

// ============================================================================
// OIDC Config API
// ============================================================================

export interface OidcScope {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
}

export interface OidcClaim {
  id: string;
  name: string;
  userAttribute: string;
  regexRuleId?: string;
  regexRule?: OidcRegexRule;
  targetTokens: Array<'ID_TOKEN' | 'ACCESS_TOKEN' | 'USERINFO'>;
}

export interface OidcRegexRule {
  id: string;
  name: string;
  pattern: string;
  replacement: string;
  flags: string;
}

export interface OidcSigningKey {
  id: string;
  kid: string;
  algorithm: 'RS256' | 'ES256';
  publicKey: string;
  certChain?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface OidcTokenPolicy {
  accessTokenLifetime: number;
  idTokenLifetime: number;
  refreshTokenLifetime: number;
  rotationEnabled: boolean;
  reuseInterval: number;
}

export const oidcConfigApi = {
  async getConfig(orgId: string, appId: string): Promise<any> {
    const response = await fetch(`${API_URL}/orgs/${orgId}/applications/${appId}/oidc-config`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch OIDC configuration');
    return response.json();
  },

  async createScope(orgId: string, appId: string, data: any): Promise<OidcScope> {
    const response = await fetch(`${API_URL}/orgs/${orgId}/applications/${appId}/oidc-config/scopes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getClaims(orgId: string, appId: string): Promise<OidcClaim[]> {
    const response = await fetch(`${API_URL}/orgs/${orgId}/applications/${appId}/oidc-config/claims`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch claims');
    return response.json();
  },

  async createClaim(orgId: string, appId: string, data: any): Promise<OidcClaim> {
    const response = await fetch(`${API_URL}/orgs/${orgId}/applications/${appId}/oidc-config/claims`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create claim');
    return response.json();
  },

  async getRegexRules(orgId: string, appId: string): Promise<OidcRegexRule[]> {
    const response = await fetch(`${API_URL}/orgs/${orgId}/applications/${appId}/oidc-config/regex-rules`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch regex rules');
    return response.json();
  },

  async createRegexRule(orgId: string, appId: string, data: any): Promise<OidcRegexRule> {
    const response = await fetch(`${API_URL}/orgs/${orgId}/applications/${appId}/oidc-config/regex-rules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create regex rule');
    return response.json();
  },

  async createSigningKey(orgId: string, appId: string, data: any): Promise<OidcSigningKey> {
    const response = await fetch(`${API_URL}/orgs/${orgId}/applications/${appId}/oidc-config/signing-keys`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async updateTokenPolicy(orgId: string, appId: string, data: Partial<OidcTokenPolicy>): Promise<OidcTokenPolicy> {
    const response = await fetch(`${API_URL}/orgs/${orgId}/applications/${appId}/oidc-config/token-policy`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// ============================================================================
// Directory API
// ============================================================================

export const directoryApi = {
  async getConfig(orgId: string): Promise<any> {
    const response = await fetch(`${API_URL}/directory/ldap/${orgId}/config`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return response.json();
  },

  async updateConfig(orgId: string, data: any): Promise<any> {
    const response = await fetch(`${API_URL}/directory/ldap/${orgId}/config`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update directory configuration');
    return response.json();
  },

  async sync(orgId: string): Promise<{ status: string }> {
    const response = await fetch(`${API_URL}/directory/ldap/${orgId}/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to initiate sync');
    return response.json();
  },

  async generateScimToken(orgId: string): Promise<{ token: string }> {
    // Shared with existing SCIM logic
    const response = await fetch(`${API_URL}/directory/scim/${orgId}/token`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to generate SCIM token');
    return response.json();
  },
};

// Simplified WebAuthn types for client-side use
export interface PublicKeyCredentialCreationOptionsJSON {
  challenge: string;
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  rp: {
    name: string;
    id?: string;
  };
  pubKeyCredParams: Array<{ alg: number; type: "public-key" }>;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  timeout?: number;
  attestation?: AttestationConveyancePreference;
}

// ============================================================================
// Organization Settings API
// ============================================================================

export type OrgRole =
  | 'API_ACCESS_MANAGEMENT_ADMIN'
  | 'APP_ADMIN'
  | 'GROUP_MEMBERSHIP_ADMIN'
  | 'HELP_DESK_ADMIN'
  | 'MOBILE_ADMIN'
  | 'ORG_ADMIN'
  | 'READ_ONLY_ADMIN'
  | 'REPORT_ADMIN'
  | 'SUPER_ADMIN'
  | 'USER_ADMIN';

export interface OrganizationProfile {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  settings: Record<string, string>;
}

export interface OrgUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  role: OrgRole;
  lastLoginAt?: string | null;
  createdAt: string;
  groups: Array<{ id: string; name: string }>;
  applications?: Array<{ id: string; name: string; type: 'OIDC' | 'SAML'; status: AppStatus }>;
  mustChangePassword?: boolean;
}

export interface OrgGroup {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  createdAt: string;
  members: Array<{ id: string; email: string; firstName?: string; lastName?: string; role: OrgRole }>;
  applications?: Array<{ id: string; name: string; type: 'OIDC' | 'SAML'; status: AppStatus }>;
}

export const roleVisibleTabs: Record<OrgRole, string[]> = {
  SUPER_ADMIN: ['dashboard', 'applications', 'users', 'groups', 'directory', 'oidc-config', 'api-access', 'policies', 'audit', 'settings'],
  READ_ONLY_ADMIN: ['dashboard', 'applications', 'users', 'groups', 'audit', 'settings'],
  ORG_ADMIN: ['dashboard', 'applications', 'users', 'groups', 'directory', 'oidc-config', 'api-access', 'policies', 'audit', 'settings'],
  APP_ADMIN: ['dashboard', 'applications', 'api-access', 'settings'],
  USER_ADMIN: ['dashboard', 'users', 'groups', 'settings'],
  GROUP_MEMBERSHIP_ADMIN: ['dashboard', 'users', 'groups', 'directory', 'settings'],
  HELP_DESK_ADMIN: ['dashboard', 'users', 'settings'],
  MOBILE_ADMIN: ['dashboard', 'applications', 'settings'],
  REPORT_ADMIN: ['dashboard', 'audit', 'settings'],
  API_ACCESS_MANAGEMENT_ADMIN: ['dashboard', 'applications', 'directory', 'api-access', 'settings'],
};

export const organizationSettingsApi = {
  async getOrg(): Promise<OrganizationProfile> {
    const response = await fetch(`${API_URL}/org`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch organization profile');
    return response.json();
  },

  async updateOrg(data: { name?: string; settings?: Record<string, string> }): Promise<OrganizationProfile> {
    const response = await fetch(`${API_URL}/org`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update organization profile');
    return response.json();
  },
};

export const usersApi = {
  async list(params?: {
    search?: string;
    role?: OrgRole;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: OrgUser[]; total: number; page: number; limit: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const response = await fetch(`${API_URL}/users?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async create(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    role?: OrgRole;
    groupIds?: string[];
    applicationIds?: string[];
    onboardingMethod?: 'MAGIC_LINK' | 'TEMP_PASSWORD';
    temporaryPassword?: string;
  }): Promise<OrgUser> {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  async update(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      role?: OrgRole;
      status?: 'ACTIVE' | 'SUSPENDED';
      groupIds?: string[];
      applicationIds?: string[];
    },
  ): Promise<OrgUser> {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  async remove(userId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  },

  async setApplications(userId: string, applicationIds: string[]): Promise<{ success: boolean; applicationIds: string[] }> {
    const response = await fetch(`${API_URL}/users/${userId}/applications`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ applicationIds }),
    });
    if (!response.ok) throw new Error('Failed to update user application assignments');
    return response.json();
  },
};

export const groupsApi = {
  async list(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ groups: OrgGroup[]; total: number; page: number; limit: number; totalPages: number }> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const response = await fetch(`${API_URL}/groups?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch groups');
    return response.json();
  },

  async create(data: { name: string; description?: string }): Promise<OrgGroup> {
    const response = await fetch(`${API_URL}/groups`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create group');
    return response.json();
  },

  async update(groupId: string, data: { name?: string; description?: string }): Promise<OrgGroup> {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update group');
    return response.json();
  },

  async setUsers(groupId: string, userIds: string[]): Promise<{ success: boolean; userIds: string[] }> {
    const response = await fetch(`${API_URL}/groups/${groupId}/users`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userIds }),
    });
    if (!response.ok) throw new Error('Failed to update group members');
    return response.json();
  },

  async setApplications(groupId: string, applicationIds: string[]): Promise<{ success: boolean; applicationIds: string[] }> {
    const response = await fetch(`${API_URL}/groups/${groupId}/applications`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ applicationIds }),
    });
    if (!response.ok) throw new Error('Failed to update group application assignments');
    return response.json();
  },

  async remove(groupId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete group');
    return response.json();
  },
};
