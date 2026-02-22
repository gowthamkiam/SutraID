/**
 * OIDC IdP Controller Tests
 *
 * Tests each route handler with mock req/res objects following
 * the project convention (direct method calls, not supertest).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { OidcIdpController } from './oidc-idp.controller';
import { OidcIdpService } from '../services/oidc-idp.service';
import { AuthService } from '../../auth/services/auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('OidcIdpController', () => {
  let controller: OidcIdpController;

  const TEST_ORG_ID = '22843968-59d7-4488-9ef2-f9f720945b57';
  const TEST_CLIENT_ID = 'app_4b66113d6d7fd374183c94837d306fcf';
  const TEST_USER = {
    id: 'usr_a1b2c3d4e5f6',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockOidcIdpService = {
    getDiscoveryMetadata: jest.fn(),
    dispatchToProvider: jest.fn(),
    getProviderInstance: jest.fn(),
    handleInteraction: jest.fn(),
  };

  const mockAuthService = {
    verifyAccessToken: jest.fn(),
    getUserById: jest.fn(),
  };

  const mockPrismaService = {
    application: {
      findFirst: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        FRONTEND_URL: 'http://localhost:3001',
        BACKEND_URL: 'http://localhost:3000',
        API_PREFIX: 'api/v1',
      };
      return config[key];
    }),
  };

  // ── Mock req/res helpers ────────────────────────────────────────────

  function createMockReq(overrides: Record<string, any> = {}): any {
    return {
      headers: {},
      cookies: {},
      get: jest.fn((header: string) => {
        if (header === 'x-forwarded-proto') return undefined;
        if (header === 'host') return 'localhost:3000';
        return undefined;
      }),
      protocol: 'http',
      originalUrl: `/api/v1/sso/oidc-idp/${TEST_ORG_ID}/authorize`,
      ...overrides,
    };
  }

  function createMockRes(): any {
    const res: any = {
      redirect: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      set: jest.fn(),
    };
    return res;
  }

  // ── Setup ─────────────────────────────────────────────────────────────

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OidcIdpController],
      providers: [
        { provide: OidcIdpService, useValue: mockOidcIdpService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<OidcIdpController>(OidcIdpController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── getDiscovery ──────────────────────────────────────────────────────

  describe('getDiscovery', () => {
    it('should return OIDC discovery metadata', async () => {
      const metadata = {
        issuer: `http://localhost:3000/api/v1/sso/oidc-idp/${TEST_ORG_ID}`,
        authorization_endpoint: `http://localhost:3000/api/v1/sso/oidc-idp/${TEST_ORG_ID}/authorize`,
        token_endpoint: 'http://localhost:3000/oauth/token',
      };
      mockOidcIdpService.getDiscoveryMetadata.mockResolvedValue(metadata);

      const result = await controller.getDiscovery(TEST_ORG_ID);

      expect(result).toEqual(metadata);
      expect(mockOidcIdpService.getDiscoveryMetadata).toHaveBeenCalledWith(TEST_ORG_ID);
    });
  });

  // ── authorize ─────────────────────────────────────────────────────────

  describe('authorize', () => {
    it('should redirect unauthenticated user to frontend login with returnUrl', async () => {
      const req = createMockReq();
      const res = createMockRes();

      await controller.authorize(TEST_ORG_ID, req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3001/login?returnUrl='),
      );
    });

    it('should dispatch to provider when user is authenticated via Bearer token', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockOidcIdpService.dispatchToProvider.mockResolvedValue(undefined);

      await controller.authorize(TEST_ORG_ID, req, res);

      expect(mockOidcIdpService.dispatchToProvider).toHaveBeenCalledWith(
        TEST_ORG_ID,
        req,
        res,
      );
    });

    it('should dispatch to provider when user is authenticated via cookie', async () => {
      const req = createMockReq({
        cookies: { access_token: 'cookie-token' },
      });
      const res = createMockRes();

      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockOidcIdpService.dispatchToProvider.mockResolvedValue(undefined);

      await controller.authorize(TEST_ORG_ID, req, res);

      expect(mockOidcIdpService.dispatchToProvider).toHaveBeenCalledWith(
        TEST_ORG_ID,
        req,
        res,
      );
    });

    it('should propagate error when dispatchToProvider rejects', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockOidcIdpService.dispatchToProvider.mockRejectedValue(new Error('provider error'));

      // dispatchToProvider is returned (not awaited) inside try/catch, so
      // the raw rejection propagates without being wrapped.
      await expect(controller.authorize(TEST_ORG_ID, req, res)).rejects.toThrow(
        'provider error',
      );
    });
  });

  // ── autoConfirm ───────────────────────────────────────────────────────

  describe('autoConfirm', () => {
    it('should redirect unauthenticated user to frontend login', async () => {
      const req = createMockReq();
      const res = createMockRes();

      await controller.autoConfirm(TEST_ORG_ID, 'uid-123', req, res);

      expect(res.redirect).toHaveBeenCalledWith('http://localhost:3001/login');
    });

    it('should auto-confirm and redirect to returnTo URL for authenticated user', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockOidcIdpService.handleInteraction.mockResolvedValue(
        'http://localhost:3000/api/v1/sso/oidc-idp/org-1/authorize/uid-resume',
      );

      await controller.autoConfirm(TEST_ORG_ID, 'uid-123', req, res);

      expect(mockOidcIdpService.handleInteraction).toHaveBeenCalledWith(
        TEST_ORG_ID,
        'uid-123',
        TEST_USER.id,
        true,
        req,
        res,
      );
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/sso/oidc-idp/org-1/authorize/uid-resume',
      );
    });
  });

  // ── token ─────────────────────────────────────────────────────────────

  describe('token', () => {
    it('should dispatch POST /token to provider', async () => {
      const req = createMockReq();
      const res = createMockRes();
      mockOidcIdpService.dispatchToProvider.mockResolvedValue(undefined);

      await controller.token(TEST_ORG_ID, req, res);

      expect(mockOidcIdpService.dispatchToProvider).toHaveBeenCalledWith(
        TEST_ORG_ID,
        req,
        res,
      );
    });
  });

  // ── userinfo ──────────────────────────────────────────────────────────

  describe('userinfo', () => {
    it('should dispatch GET /userinfo to provider', async () => {
      const req = createMockReq();
      const res = createMockRes();
      mockOidcIdpService.dispatchToProvider.mockResolvedValue(undefined);

      await controller.userinfo(TEST_ORG_ID, req, res);

      expect(mockOidcIdpService.dispatchToProvider).toHaveBeenCalledWith(
        TEST_ORG_ID,
        req,
        res,
      );
    });
  });

  // ── jwks ──────────────────────────────────────────────────────────────

  describe('jwks', () => {
    it('should dispatch GET /jwks to provider', async () => {
      const req = createMockReq();
      const res = createMockRes();
      mockOidcIdpService.dispatchToProvider.mockResolvedValue(undefined);

      await controller.jwks(TEST_ORG_ID, req, res);

      expect(mockOidcIdpService.dispatchToProvider).toHaveBeenCalledWith(
        TEST_ORG_ID,
        req,
        res,
      );
    });
  });

  // ── getInteraction ────────────────────────────────────────────────────

  describe('getInteraction', () => {
    it('should return 401 when user not authenticated', async () => {
      const req = createMockReq();
      const res = createMockRes();

      await controller.getInteraction(TEST_ORG_ID, 'uid-123', req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should return interaction details with application info for authenticated user', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);

      const mockProvider = {
        interactionDetails: jest.fn().mockResolvedValue({
          params: {
            client_id: TEST_CLIENT_ID,
            scope: 'openid profile email',
            redirect_uri: 'https://localhost:3000/callback',
          },
        }),
      };
      mockOidcIdpService.getProviderInstance.mockResolvedValue(mockProvider);

      const mockApp = {
        id: 'app-1',
        name: 'Test App',
        description: 'Test',
        logoUrl: null,
      };
      mockPrismaService.application.findFirst.mockResolvedValue(mockApp);

      await controller.getInteraction(TEST_ORG_ID, 'uid-123', req, res);

      expect(res.json).toHaveBeenCalledWith({
        uid: 'uid-123',
        application: mockApp,
        scopes: ['openid', 'profile', 'email'],
        redirectUri: 'https://localhost:3000/callback',
      });
    });

    it('should throw BadRequestException when application not found', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);

      const mockProvider = {
        interactionDetails: jest.fn().mockResolvedValue({
          params: { client_id: 'unknown-client', scope: 'openid' },
        }),
      };
      mockOidcIdpService.getProviderInstance.mockResolvedValue(mockProvider);
      mockPrismaService.application.findFirst.mockResolvedValue(null);

      await expect(
        controller.getInteraction(TEST_ORG_ID, 'uid-123', req, res),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── confirmInteraction ────────────────────────────────────────────────

  describe('confirmInteraction', () => {
    it('should throw BadRequestException (wrapping UnauthorizedException) when user not authenticated', async () => {
      const req = createMockReq();
      const res = createMockRes();

      // The controller's try/catch catches the UnauthorizedException and
      // re-throws as BadRequestException.
      await expect(
        controller.confirmInteraction(
          TEST_ORG_ID,
          'uid-123',
          { consent: true },
          req,
          res,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should confirm consent and return success with redirectTo URL', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockOidcIdpService.handleInteraction.mockResolvedValue(
        'https://localhost:3000/callback?code=abc&state=xyz',
      );

      await controller.confirmInteraction(
        TEST_ORG_ID,
        'uid-123',
        { consent: true },
        req,
        res,
      );

      expect(mockOidcIdpService.handleInteraction).toHaveBeenCalledWith(
        TEST_ORG_ID,
        'uid-123',
        TEST_USER.id,
        true,
        req,
        res,
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        redirectTo: 'https://localhost:3000/callback?code=abc&state=xyz',
      });
    });

    it('should handle consent denial', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockOidcIdpService.handleInteraction.mockResolvedValue(
        'https://localhost:3000/callback?error=access_denied',
      );

      await controller.confirmInteraction(
        TEST_ORG_ID,
        'uid-123',
        { consent: false },
        req,
        res,
      );

      expect(mockOidcIdpService.handleInteraction).toHaveBeenCalledWith(
        TEST_ORG_ID,
        'uid-123',
        TEST_USER.id,
        false,
        req,
        res,
      );
    });
  });

  // ── callback (wildcard) ───────────────────────────────────────────────

  describe('callback (wildcard)', () => {
    it('should dispatch all unmatched routes to provider', async () => {
      const req = createMockReq();
      const res = createMockRes();
      mockOidcIdpService.dispatchToProvider.mockResolvedValue(undefined);

      await controller.callback(TEST_ORG_ID, req, res);

      expect(mockOidcIdpService.dispatchToProvider).toHaveBeenCalledWith(
        TEST_ORG_ID,
        req,
        res,
      );
    });
  });
});
