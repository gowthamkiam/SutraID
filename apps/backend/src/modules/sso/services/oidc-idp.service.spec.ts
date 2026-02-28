import { Test, TestingModule } from '@nestjs/testing';
import { OidcIdpService } from './oidc-idp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { RegexService } from '../utils/regex.service';
import { OidcConfigService } from './oidc-config.service';
import { AuditService } from '../../audit/audit.service';

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
  registerGrantType: jest.fn(),
  Grant: jest.fn().mockImplementation(() => mockGrant),
  app: {
    callback: jest.fn().mockReturnValue(jest.fn().mockResolvedValue(undefined)),
  },
}));

describe('OidcIdpService', () => {
  let service: OidcIdpService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;



  const mockApplication = {
    id: 'app-1',
    name: 'Test App',
    clientId: 'client-123',
    clientSecretHash: 'secret-456',
    redirectUris: ['https://example.com/callback'],
    status: 'ACTIVE',
    allowROPC: false,
    allowClientCredentials: false,
    allowRefreshForROPC: false,
    pkceRequired: true,
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
    application: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    oidcSigningKey: {
      create: jest.fn().mockResolvedValue({
        id: '1', kid: 'sig-123', algorithm: 'RS256', publicKey: 'PUB', privateKey: 'PRIV', isDefault: true
      })
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

  const mockRegexService = {
    replace: jest.fn().mockImplementation((val) => Promise.resolve(val)),
    validate: jest.fn().mockResolvedValue({ isValid: true }),
  };

  const mockOidcConfigService = {
    getTokenPolicy: jest.fn().mockResolvedValue({
      accessTokenLifetime: 3600,
      idTokenLifetime: 3600,
      refreshTokenLifetime: 86400 * 30,
    }),
    getSigningKeys: jest.fn().mockResolvedValue([]),
    getSigningKeysWithPrivate: jest.fn().mockResolvedValue([]),
    getScopes: jest.fn().mockResolvedValue([]),
    getClaims: jest.fn().mockResolvedValue([]),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
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
        {
          provide: RegexService,
          useValue: mockRegexService,
        },
        {
          provide: OidcConfigService,
          useValue: mockOidcConfigService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<OidcIdpService>(OidcIdpService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);

    // Mock loadProvider to return our mock constructor instead of dynamically importing oidc-provider
    jest.spyOn(service as any, 'loadProvider').mockResolvedValue(mockProviderConstructor);
    // Mock dynamicImport to prevent ESM issues in tests
    jest.spyOn(service as any, 'dynamicImport').mockImplementation((specifier) => {
      if (specifier === 'bcrypt') {
        return Promise.resolve({ compare: jest.fn().mockResolvedValue(true) });
      }
      return Promise.resolve({});
    });
  });

  describe('getProviderInstance', () => {
    it('should throw BadRequestException if organization not found', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.getProviderInstance('non-existent')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create and cache OIDC provider instance', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      const provider = await service.getProviderInstance('app-1');

      expect(provider).toBeDefined();
      expect(provider.issuer).toBe('http://localhost:3000/api/v1/sso/oidc-idp/app-1');
    });

    it('should return cached instance on subsequent calls', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);

      // Subsequent calls will use the cache
      const provider1 = await service.getProviderInstance('app-1');
      const provider2 = await service.getProviderInstance('app-1');

      expect(provider1).toBe(provider2);
    });
  });

  describe('getDiscoveryMetadata', () => {
    it('should return OIDC discovery metadata', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);

      const metadata = await service.getDiscoveryMetadata('app-1');

      expect(metadata.issuer).toBe('http://localhost:3000/api/v1/sso/oidc-idp/app-1');
      expect(metadata.authorization_endpoint).toBe(
        'http://localhost:3000/api/v1/sso/oidc-idp/app-1/authorize',
      );
      expect(metadata.token_endpoint).toBe(
        'http://localhost:3000/api/v1/oauth/token',
      );
      expect(metadata.response_types_supported).toEqual(['code']);
      expect(metadata.grant_types_supported).toEqual(['authorization_code', 'refresh_token']);
    });

    it('should include password grant when allowROPC is true', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        ...mockApplication,
        allowROPC: true,
        allowClientCredentials: true,
      });

      const metadata = await service.getDiscoveryMetadata('app-1');

      expect(metadata.grant_types_supported).toContain('password');
      expect(metadata.grant_types_supported).toContain('client_credentials');
    });
  });

  describe('handleInteraction', () => {
    it('should return interactionResult URL when consent is denied', async () => {
      const req = { headers: {} };
      const res = {};
      const provider = await service.getProviderInstance('app-1');

      provider.interactionDetails.mockResolvedValue({
        uid: 'interaction-uid',
        params: { client_id: 'client-123' },
      });
      provider.interactionResult.mockResolvedValue('https://example.com/callback?error=access_denied');

      const result = await service.handleInteraction('app-1', 'interaction-uid', 'user-1', false, req, res);

      expect(result).toBe('https://example.com/callback?error=access_denied');
    });

    it('should create grant and return redirect URL on consent success', async () => {
      const req = { headers: {} };
      const res = {};
      const provider = await service.getProviderInstance('app-1');

      provider.interactionDetails.mockResolvedValue({
        uid: 'uid-1',
        params: { client_id: 'client-123', scope: 'openid profile' },
      });
      provider.interactionResult.mockResolvedValue('https://example.com/callback?code=abc');

      const result = await service.handleInteraction('app-1', 'uid-1', 'user-1', true, req, res);

      expect(result).toBe('https://example.com/callback?code=abc');
      expect(mockGrant.save).toHaveBeenCalled();
    });
  });

  describe('Database Adapter', () => {
    it('should create adapter for token storage', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);

      const adapter = (service as any).createAdapter('app-1');
      expect(adapter).toBeDefined();

      const adapterInstance = new adapter('AccessToken');
      expect(adapterInstance.name).toBe('AccessToken');
    });

    it('adapter should upsert tokens', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockApplication);
      mockPrismaService.oidcToken.upsert.mockResolvedValue({});

      const adapter = (service as any).createAdapter('app-1');
      const adapterInstance = new adapter('AccessToken');

      await adapterInstance.upsert('token-id', { data: 'test' }, 3600);

      expect(mockPrismaService.oidcToken.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            applicationId_type_tokenId: {
              applicationId: 'app-1',
              type: 'AccessToken',
              tokenId: 'token-id',
            },
          },
        }),
      );
    });
  });

  describe('dispatchToProvider', () => {
    it('should strip issuer path prefix and invoke provider callback', async () => {
      const mockCallback = jest.fn().mockResolvedValue(undefined);
      const provider = await service.getProviderInstance('app-1');
      provider.app.callback.mockReturnValue(mockCallback);

      const req: any = { url: '/api/v1/sso/oidc-idp/app-1/token' };
      const res: any = {};

      await service.dispatchToProvider('app-1', req, res);

      expect(mockCallback).toHaveBeenCalledWith(req, res);
      expect(req.url).toBe('/api/v1/sso/oidc-idp/app-1/token');
    });
  });
});
