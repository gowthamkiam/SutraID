import { Test, TestingModule } from '@nestjs/testing';
import { OidcIdpService } from './oidc-idp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

// Mock Grant for consent flow
const mockGrant = {
  addOIDCScope: jest.fn(),
  addOIDCClaims: jest.fn(),
  save: jest.fn().mockResolvedValue('grant-id-123'),
};

// Mock provider constructor — returned by spying on loadProvider()
const mockProviderConstructor = jest.fn().mockImplementation((issuer, config) => ({
  issuer,
  config,
  interactionDetails: jest.fn(),
  interactionFinished: jest.fn(),
  interactionResult: jest.fn(),
  Grant: jest.fn().mockImplementation(() => mockGrant),
  app: {
    callback: jest.fn().mockReturnValue(jest.fn().mockResolvedValue(undefined)),
  },
}));

describe('OidcIdpService', () => {
  let service: OidcIdpService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;

  const mockOrganization = {
    id: 'org-1',
    name: 'Test Organization',
    slug: 'test-org',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApplication = {
    id: 'app-1',
    organizationId: 'org-1',
    name: 'Test App',
    clientId: 'client-123',
    clientSecretHash: 'secret-456',
    redirectUris: ['https://example.com/callback'],
    status: 'ACTIVE',
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    emailVerified: true,
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
    },
    application: {
      findMany: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    oidcToken: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        BACKEND_URL: 'http://localhost:3000',
        FRONTEND_URL: 'http://localhost:3001',
        ENCRYPTION_KEY: 'test-encryption-key-32-bytes-long!',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OidcIdpService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OidcIdpService>(OidcIdpService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);

    // Mock loadProvider to return our mock constructor instead of dynamically importing oidc-provider
    jest.spyOn(service as any, 'loadProvider').mockResolvedValue(mockProviderConstructor);
  });

  describe('getProviderInstance', () => {
    it('should throw BadRequestException if organization not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.getProviderInstance('non-existent')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getProviderInstance('non-existent')).rejects.toThrow(
        'Organization not found',
      );
    });

    it('should create and cache OIDC provider instance', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      const provider = await service.getProviderInstance('org-1');

      expect(provider).toBeDefined();
      expect(provider.issuer).toBe('http://localhost:3000/api/v1/sso/oidc-idp/org-1');
    });

    it('should return cached instance on subsequent calls', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      const provider1 = await service.getProviderInstance('org-1');
      const provider2 = await service.getProviderInstance('org-1');

      expect(provider1).toBe(provider2);
      // Organization should only be fetched once
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDiscoveryMetadata', () => {
    it('should return OIDC discovery metadata', async () => {
      const metadata = await service.getDiscoveryMetadata('org-1');

      expect(metadata.issuer).toBe('http://localhost:3000/api/v1/sso/oidc-idp/org-1');
      expect(metadata.authorization_endpoint).toBe(
        'http://localhost:3000/api/v1/sso/oidc-idp/org-1/authorize',
      );
      expect(metadata.token_endpoint).toBe(
        'http://localhost:3000/oauth/token',
      );
      expect(metadata.userinfo_endpoint).toBe(
        'http://localhost:3000/api/v1/sso/oidc-idp/org-1/userinfo',
      );
      expect(metadata.jwks_uri).toBe(
        'http://localhost:3000/api/v1/sso/oidc-idp/org-1/jwks',
      );
    });

    it('should include supported scopes', async () => {
      const metadata = await service.getDiscoveryMetadata('org-1');

      expect(metadata.scopes_supported).toContain('openid');
      expect(metadata.scopes_supported).toContain('email');
      expect(metadata.scopes_supported).toContain('profile');
    });

    it('should include supported response types', async () => {
      const metadata = await service.getDiscoveryMetadata('org-1');

      expect(metadata.response_types_supported).toContain('code');
      expect(metadata.response_types_supported).toContain('id_token');
    });

    it('should include supported grant types', async () => {
      const metadata = await service.getDiscoveryMetadata('org-1');

      expect(metadata.grant_types_supported).toContain('authorization_code');
      expect(metadata.grant_types_supported).toContain('refresh_token');
    });

    it('should include supported claims', async () => {
      const metadata = await service.getDiscoveryMetadata('org-1');

      expect(metadata.claims_supported).toContain('sub');
      expect(metadata.claims_supported).toContain('email');
      expect(metadata.claims_supported).toContain('name');
    });

    it('should require PKCE', async () => {
      const metadata = await service.getDiscoveryMetadata('org-1');

      expect(metadata.code_challenge_methods_supported).toContain('S256');
    });
  });

  describe('clearProviderCache', () => {
    it('should clear cached provider instance', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      // Create and cache instance
      await service.getProviderInstance('org-1');

      // Clear cache
      service.clearProviderCache('org-1');

      // Next call should create new instance
      await service.getProviderInstance('org-1');

      // Organization should be fetched twice
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleInteraction', () => {
    it('should return interactionResult URL when consent is denied', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      const mockProvider = await service.getProviderInstance('org-1');
      mockProvider.interactionDetails.mockResolvedValue({
        params: { client_id: 'client-123', scope: 'openid email' },
        prompt: { details: {} },
      });
      mockProvider.interactionResult.mockResolvedValue('https://example.com/callback?error=access_denied');

      const result = await service.handleInteraction('org-1', 'interaction-uid', 'user-1', false, {}, {});

      expect(result).toBe('https://example.com/callback?error=access_denied');
      expect(mockProvider.interactionResult).toHaveBeenCalledWith(
        {},
        {},
        { error: 'access_denied', error_description: 'User denied consent' },
        { mergeWithLastSubmission: false },
      );
    });
  });

  describe('Database Adapter', () => {
    it('should create adapter for token storage', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      // Access private method to test adapter creation
      const adapter = (service as any).createAdapter('org-1');
      expect(adapter).toBeDefined();

      // Create adapter instance
      const adapterInstance = new adapter('AccessToken');
      expect(adapterInstance.name).toBe('AccessToken');
    });

    it('adapter should upsert tokens', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);
      mockPrismaService.oidcToken.upsert.mockResolvedValue({});

      const adapter = (service as any).createAdapter('org-1');
      const adapterInstance = new adapter('AccessToken');

      await adapterInstance.upsert('token-id', { data: 'test' }, 3600);

      expect(mockPrismaService.oidcToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId_type_tokenId: {
              organizationId: 'org-1',
              type: 'AccessToken',
              tokenId: 'token-id',
            },
          },
        }),
      );
    });

    it('adapter should find tokens', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      const futureDate = new Date(Date.now() + 3600000);
      mockPrismaService.oidcToken.findUnique.mockResolvedValue({
        payload: JSON.stringify({ data: 'test' }),
        expiresAt: futureDate,
      });

      const adapter = (service as any).createAdapter('org-1');
      const adapterInstance = new adapter('AccessToken');

      const result = await adapterInstance.find('token-id');

      expect(result).toEqual({ data: 'test' });
    });

    it('adapter should return undefined for expired tokens', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      const pastDate = new Date(Date.now() - 3600000);
      mockPrismaService.oidcToken.findUnique.mockResolvedValue({
        payload: JSON.stringify({ data: 'test' }),
        expiresAt: pastDate,
      });

      const adapter = (service as any).createAdapter('org-1');
      const adapterInstance = new adapter('AccessToken');

      const result = await adapterInstance.find('token-id');

      expect(result).toBeUndefined();
    });

    it('adapter should consume tokens', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);
      mockPrismaService.oidcToken.update.mockResolvedValue({});

      const adapter = (service as any).createAdapter('org-1');
      const adapterInstance = new adapter('AuthorizationCode');

      await adapterInstance.consume('token-id');

      expect(mockPrismaService.oidcToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId_type_tokenId: {
              organizationId: 'org-1',
              type: 'AuthorizationCode',
              tokenId: 'token-id',
            },
          },
          data: expect.objectContaining({
            consumed: true,
          }),
        }),
      );
    });

    it('adapter should destroy tokens', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);
      mockPrismaService.oidcToken.delete.mockResolvedValue({});

      const adapter = (service as any).createAdapter('org-1');
      const adapterInstance = new adapter('RefreshToken');

      await adapterInstance.destroy('token-id');

      expect(mockPrismaService.oidcToken.delete).toHaveBeenCalledWith({
        where: {
          organizationId_type_tokenId: {
            organizationId: 'org-1',
            type: 'RefreshToken',
            tokenId: 'token-id',
          },
        },
      });
    });

    it('adapter should revoke tokens by grant ID', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);
      mockPrismaService.oidcToken.deleteMany.mockResolvedValue({ count: 2 });

      const adapter = (service as any).createAdapter('org-1');
      const adapterInstance = new adapter('AccessToken');

      await adapterInstance.revokeByGrantId('grant-123');

      expect(mockPrismaService.oidcToken.deleteMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          type: 'AccessToken',
          payload: {
            contains: 'grant-123',
          },
        },
      });
    });
  });

  describe('findAccount', () => {
    it('should find user by ID with organization membership', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      // Access private method
      const account = await (service as any).findAccount('org-1', 'user-1');

      expect(account).toBeDefined();
      expect(account.accountId).toBe('user-1');
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
          organizationMembers: {
            some: {
              organizationId: 'org-1',
              status: 'ACTIVE',
            },
          },
        },
      });
    });

    it('should return undefined if user not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const account = await (service as any).findAccount('org-1', 'user-1');

      expect(account).toBeUndefined();
    });

    it('should return claims for user account', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const account = await (service as any).findAccount('org-1', 'user-1');
      const claims = await account.claims('id_token', 'openid email profile');

      expect(claims.sub).toBe('user-1');
      expect(claims.email).toBe('test@example.com');
      expect(claims.email_verified).toBe(true);
      expect(claims.given_name).toBe('John');
      expect(claims.family_name).toBe('Doe');
      expect(claims.name).toBe('John Doe');
    });
  });

  describe('getClients', () => {
    it('should get registered OIDC clients for organization', async () => {
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      const clients = await (service as any).getClients('org-1');

      expect(clients).toHaveLength(1);
      expect(clients[0].client_id).toBe('client-123');
      expect(clients[0].client_secret).toBe('secret-456');
      expect(clients[0].redirect_uris).toEqual(['https://example.com/callback']);
    });

    it('should only return enabled and active applications', async () => {
      mockPrismaService.application.findMany.mockResolvedValue([]);

      await (service as any).getClients('org-1');

      expect(mockPrismaService.application.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          type: 'OIDC',
          status: 'ACTIVE',
        },
      });
    });

    it('should configure public client with token_endpoint_auth_method "none" when no clientSecretHash', async () => {
      const publicApp = { ...mockApplication, clientSecretHash: null };
      mockPrismaService.application.findMany.mockResolvedValue([publicApp]);

      const clients = await (service as any).getClients('org-1');

      expect(clients[0].token_endpoint_auth_method).toBe('none');
      expect(clients[0].client_secret).toBeUndefined();
    });

    it('should configure confidential client with client_secret_post when clientSecretHash present', async () => {
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      const clients = await (service as any).getClients('org-1');

      expect(clients[0].token_endpoint_auth_method).toBe('client_secret_post');
      expect(clients[0].client_secret).toBe('secret-456');
    });
  });

  // ── handleInteraction — consent granted ───────────────────────────────

  describe('handleInteraction - consent granted', () => {
    let mockProvider: any;

    beforeEach(async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);
      mockProvider = await service.getProviderInstance('org-1');
      mockGrant.addOIDCScope.mockClear();
      mockGrant.addOIDCClaims.mockClear();
      mockGrant.save.mockClear().mockResolvedValue('grant-id-123');
    });

    it('should create grant, add scopes from missingOIDCScope, and return redirect URL', async () => {
      mockProvider.interactionDetails.mockResolvedValue({
        params: { client_id: 'client-123', scope: 'openid email' },
        prompt: { details: { missingOIDCScope: ['openid', 'email'] } },
      });
      mockProvider.interactionResult.mockResolvedValue('https://example.com/callback?code=abc&state=xyz');

      const result = await service.handleInteraction('org-1', 'uid-1', 'user-1', true, {}, {});

      expect(result).toBe('https://example.com/callback?code=abc&state=xyz');
      expect(mockProvider.Grant).toHaveBeenCalledWith({
        accountId: 'user-1',
        clientId: 'client-123',
      });
      expect(mockGrant.addOIDCScope).toHaveBeenCalledWith('openid email');
      expect(mockGrant.save).toHaveBeenCalled();
      expect(mockProvider.interactionResult).toHaveBeenCalledWith(
        {},
        {},
        { login: { accountId: 'user-1' }, consent: { grantId: 'grant-id-123' } },
        { mergeWithLastSubmission: false },
      );
    });

    it('should fall back to interaction.params.scope when missingOIDCScope is absent', async () => {
      mockProvider.interactionDetails.mockResolvedValue({
        params: { client_id: 'client-123', scope: 'openid profile' },
        prompt: { details: {} },
      });
      mockProvider.interactionResult.mockResolvedValue('https://example.com/callback?code=abc');

      await service.handleInteraction('org-1', 'uid-1', 'user-1', true, {}, {});

      expect(mockGrant.addOIDCScope).toHaveBeenCalledWith('openid profile');
    });

    it('should add missingOIDCClaims to grant when present', async () => {
      mockProvider.interactionDetails.mockResolvedValue({
        params: { client_id: 'client-123', scope: 'openid' },
        prompt: { details: { missingOIDCScope: ['openid'], missingOIDCClaims: ['email', 'name'] } },
      });
      mockProvider.interactionResult.mockResolvedValue('https://example.com/callback?code=abc');

      await service.handleInteraction('org-1', 'uid-1', 'user-1', true, {}, {});

      expect(mockGrant.addOIDCClaims).toHaveBeenCalledWith(['email', 'name']);
    });

    it('should not call addOIDCClaims when missingOIDCClaims is absent', async () => {
      mockProvider.interactionDetails.mockResolvedValue({
        params: { client_id: 'client-123', scope: 'openid' },
        prompt: { details: { missingOIDCScope: ['openid'] } },
      });
      mockProvider.interactionResult.mockResolvedValue('https://example.com/callback?code=abc');

      await service.handleInteraction('org-1', 'uid-1', 'user-1', true, {}, {});

      expect(mockGrant.addOIDCClaims).not.toHaveBeenCalled();
    });
  });

  // ── handleInteraction — error propagation ─────────────────────────────

  describe('handleInteraction - error propagation', () => {
    it('should propagate error when interactionDetails throws', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      const mockProvider = await service.getProviderInstance('org-1');
      mockProvider.interactionDetails.mockRejectedValue(new Error('interaction session not found'));

      await expect(
        service.handleInteraction('org-1', 'uid-1', 'user-1', true, {}, {}),
      ).rejects.toThrow('interaction session not found');
    });
  });

  // ── dispatchToProvider ────────────────────────────────────────────────

  describe('dispatchToProvider', () => {
    it('should strip issuer path prefix from req.url and invoke provider callback', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      const mockCallback = jest.fn().mockResolvedValue(undefined);
      const provider = await service.getProviderInstance('org-1');
      provider.app.callback.mockReturnValue(mockCallback);

      const req: any = { url: '/api/v1/sso/oidc-idp/org-1/token' };
      const res: any = {};

      await service.dispatchToProvider('org-1', req, res);

      expect(mockCallback).toHaveBeenCalledWith(req, res);
      // req.url should be restored after dispatch
      expect(req.url).toBe('/api/v1/sso/oidc-idp/org-1/token');
    });

    it('should set req.url to "/" when issuer path equals full req.url', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      const callbackUrls: string[] = [];
      const mockCallback = jest.fn().mockImplementation((r: any) => {
        callbackUrls.push(r.url);
        return Promise.resolve();
      });
      const provider = await service.getProviderInstance('org-1');
      provider.app.callback.mockReturnValue(mockCallback);

      const req: any = { url: '/api/v1/sso/oidc-idp/org-1' };
      const res: any = {};

      await service.dispatchToProvider('org-1', req, res);

      expect(callbackUrls[0]).toBe('/');
    });

    it('should leave req.url unchanged when it does not start with issuer path', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([mockApplication]);

      const callbackUrls: string[] = [];
      const mockCallback = jest.fn().mockImplementation((r: any) => {
        callbackUrls.push(r.url);
        return Promise.resolve();
      });
      const provider = await service.getProviderInstance('org-1');
      provider.app.callback.mockReturnValue(mockCallback);

      const req: any = { url: '/some/other/path' };
      const res: any = {};

      await service.dispatchToProvider('org-1', req, res);

      expect(callbackUrls[0]).toBe('/some/other/path');
    });
  });

  // ── Provider configuration ────────────────────────────────────────────

  describe('provider configuration', () => {
    it('should configure PKCE as always required', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([]);

      await service.getProviderInstance('org-1');

      const config = mockProviderConstructor.mock.calls[0][1];
      expect(config.pkce.required()).toBe(true);
    });

    it('should configure correct grant types', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([]);

      await service.getProviderInstance('org-1');

      const config = mockProviderConstructor.mock.calls[0][1];
      expect(config.grantTypes).toContain('authorization_code');
      expect(config.grantTypes).toContain('refresh_token');
      expect(config.grantTypes).toContain('client_credentials');
    });

    it('should set proxy to true for reverse proxy support', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([]);

      await service.getProviderInstance('org-1');

      const config = mockProviderConstructor.mock.calls[0][1];
      expect(config.proxy).toBe(true);
    });

    it('should configure interaction URL pointing to auto-confirm endpoint', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([]);

      await service.getProviderInstance('org-1');

      const config = mockProviderConstructor.mock.calls[0][1];
      const url = await config.interactions.url({}, { uid: 'test-uid-123' });
      expect(url).toContain('/api/v1/sso/oidc-idp/org-1/auto-confirm');
      expect(url).toContain('uid=test-uid-123');
    });

    it('should configure correct response types', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([]);

      await service.getProviderInstance('org-1');

      const config = mockProviderConstructor.mock.calls[0][1];
      expect(config.responseTypes).toContain('code');
      expect(config.responseTypes).toContain('id_token');
    });

    it('should disable devInteractions and registration', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.findMany.mockResolvedValue([]);

      await service.getProviderInstance('org-1');

      const config = mockProviderConstructor.mock.calls[0][1];
      expect(config.features.devInteractions.enabled).toBe(false);
      expect(config.features.registration.enabled).toBe(false);
    });
  });
});
