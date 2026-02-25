import { Test, TestingModule } from '@nestjs/testing';
import { OauthController, OpenidConfigurationController } from './oauth.controller';
import { ApplicationService } from './application.service';
import { PrismaService } from '../prisma/prisma.service';
import { OidcIdpService } from '../sso/services/oidc-idp.service';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

describe('OauthController', () => {
  let controller: OauthController;
  let prisma: PrismaService;
  let oidcIdpService: OidcIdpService;

  const mockPrisma = {
    application: {
      findUnique: jest.fn(),
    },
  };

  const mockOidcIdpService = {
    getProviderInstance: jest.fn(),
  };

  const mockApplicationService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ name: 'ropc', ttl: 60000, limit: 5 }])],
      controllers: [OauthController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OidcIdpService, useValue: mockOidcIdpService },
        { provide: ApplicationService, useValue: mockApplicationService },
      ],
    }).compile();

    controller = module.get<OauthController>(OauthController);
    prisma = module.get<PrismaService>(PrismaService);
    oidcIdpService = module.get<OidcIdpService>(OidcIdpService);

    jest.clearAllMocks();
  });

  describe('POST /oauth/token', () => {
    const mockRes = () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    const mockReq = (body: any) => ({
      body,
      headers: {},
    } as any);

    it('should reject password grant when allowROPC is false', async () => {
      const req = mockReq({ client_id: 'test-client', grant_type: 'password', username: 'user', password: 'pass' });
      const res = mockRes();

      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        organizationId: 'org-1',
        allowROPC: false,
        allowClientCredentials: false,
      });

      await controller.token(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'unsupported_grant_type',
        error_description: expect.stringContaining('Password grant'),
      }));
    });

    it('should reject client_credentials when allowClientCredentials is false', async () => {
      const req = mockReq({ client_id: 'test-client', grant_type: 'client_credentials' });
      const res = mockRes();

      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        organizationId: 'org-1',
        allowROPC: false,
        allowClientCredentials: false,
      });

      await controller.token(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'unsupported_grant_type',
        error_description: expect.stringContaining('Client credentials'),
      }));
    });

    it('should reject implicit grant always', async () => {
      const req = mockReq({ client_id: 'test-client', grant_type: 'implicit' });
      const res = mockRes();

      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        organizationId: 'org-1',
        allowROPC: true,
        allowClientCredentials: true,
      });

      await controller.token(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'unsupported_grant_type',
        error_description: expect.stringContaining('Implicit'),
      }));
    });

    it('should pass applicationId (not organizationId) to getProviderInstance', async () => {
      const req = mockReq({ client_id: 'test-client', grant_type: 'authorization_code', code: 'abc' });
      const res = mockRes();

      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-123',
        organizationId: 'org-456',
        allowROPC: false,
        allowClientCredentials: false,
      });

      const mockCallback = jest.fn().mockResolvedValue(undefined);
      const mockProvider = { app: { callback: () => mockCallback } };
      mockOidcIdpService.getProviderInstance.mockResolvedValue(mockProvider);

      await controller.token(req, res);

      expect(mockOidcIdpService.getProviderInstance).toHaveBeenCalledWith('app-123');
    });

    it('should allow password grant when allowROPC is true', async () => {
      const req = mockReq({ client_id: 'test-client', grant_type: 'password', username: 'user', password: 'pass' });
      const res = mockRes();

      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        organizationId: 'org-1',
        allowROPC: true,
        allowClientCredentials: false,
      });

      const mockCallback = jest.fn().mockResolvedValue(undefined);
      const mockProvider = { app: { callback: () => mockCallback } };
      mockOidcIdpService.getProviderInstance.mockResolvedValue(mockProvider);

      await controller.token(req, res);

      expect(mockOidcIdpService.getProviderInstance).toHaveBeenCalledWith('app-1');
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should allow client_credentials when allowClientCredentials is true', async () => {
      const req = mockReq({ client_id: 'test-client', grant_type: 'client_credentials', client_secret: 'secret' });
      const res = mockRes();

      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        organizationId: 'org-1',
        allowROPC: false,
        allowClientCredentials: true,
      });

      const mockCallback = jest.fn().mockResolvedValue(undefined);
      const mockProvider = { app: { callback: () => mockCallback } };
      mockOidcIdpService.getProviderInstance.mockResolvedValue(mockProvider);

      await controller.token(req, res);

      expect(mockCallback).toHaveBeenCalled();
    });

    it('should extract client_id from Basic auth header', async () => {
      const basicAuth = Buffer.from('my-client-id:my-secret').toString('base64');
      const req = {
        body: { grant_type: 'authorization_code', code: 'abc' },
        headers: { authorization: `Basic ${basicAuth}` },
      } as any;
      const res = mockRes();

      mockPrisma.application.findUnique.mockResolvedValue({
        id: 'app-1',
        organizationId: 'org-1',
        allowROPC: false,
        allowClientCredentials: false,
      });

      const mockCallback = jest.fn().mockResolvedValue(undefined);
      const mockProvider = { app: { callback: () => mockCallback } };
      mockOidcIdpService.getProviderInstance.mockResolvedValue(mockProvider);

      await controller.token(req, res);

      expect(mockPrisma.application.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { clientId: 'my-client-id' } }),
      );
    });
  });
});

describe('OpenidConfigurationController', () => {
  let controller: OpenidConfigurationController;
  let prisma: PrismaService;

  const mockPrisma = {
    application: {
      findUnique: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'BACKEND_URL') return 'http://localhost:3000';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpenidConfigurationController],
      providers: [
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<OpenidConfigurationController>(OpenidConfigurationController);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('GET /.well-known/openid-configuration/:orgId/:appId', () => {
    it('should include password in grant_types when allowROPC is true', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        allowROPC: true,
        allowClientCredentials: false,
      });

      const result = await controller.getAppConfiguration('org-1', 'app-1');

      expect(result.grant_types_supported).toContain('password');
      expect(result.grant_types_supported).not.toContain('client_credentials');
    });

    it('should include client_credentials when allowClientCredentials is true', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        allowROPC: false,
        allowClientCredentials: true,
      });

      const result = await controller.getAppConfiguration('org-1', 'app-1');

      expect(result.grant_types_supported).toContain('client_credentials');
      expect(result.grant_types_supported).not.toContain('password');
    });

    it('should only return code in response_types_supported', async () => {
      mockPrisma.application.findUnique.mockResolvedValue({
        allowROPC: false,
        allowClientCredentials: false,
      });

      const result = await controller.getAppConfiguration('org-1', 'app-1');

      expect(result.response_types_supported).toEqual(['code']);
      expect(result.response_types_supported).not.toContain('id_token');
      expect(result.response_types_supported).not.toContain('token');
    });
  });

  describe('GET /.well-known/openid-configuration/:orgId', () => {
    it('should return only authorization_code and refresh_token grants', async () => {
      const result = await controller.getConfiguration('org-1');

      expect(result.grant_types_supported).toEqual(['authorization_code', 'refresh_token']);
      expect(result.response_types_supported).toEqual(['code']);
    });
  });
});
