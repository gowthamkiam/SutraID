/**
 * OIDC IdP Controller Tests
 *
 * Tests each route handler with mock req/res objects following
 * the project convention (direct method calls, not supertest).
 */
import { BadRequestException } from '@nestjs/common';
import { OidcIdpController } from './oidc-idp.controller';

describe('OidcIdpController', () => {
  let controller: OidcIdpController;

  const TEST_ORG_ID = 'org-1';
  const TEST_APP_ID = 'app-1';
  const TEST_CLIENT_ID = 'client-123';
  const TEST_USER = {
    id: 'user-1',
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
      originalUrl: `/api/v1/sso/oidc-idp/${TEST_ORG_ID}/${TEST_APP_ID}/authorize`,
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

  beforeEach(() => {
    jest.clearAllMocks();
    // Manual instantiation to avoid Nest dependency injection issues in tests
    controller = new OidcIdpController(
      mockOidcIdpService as any,
      mockAuthService as any,
      mockPrismaService as any,
      mockConfigService as any
    );
  });

  // ── getDiscovery ──────────────────────────────────────────────────────

  describe('getDiscovery', () => {
    it('should return OIDC discovery metadata', async () => {
      const metadata = {
        issuer: `http://localhost:3000/api/v1/sso/oidc-idp/${TEST_ORG_ID}/${TEST_APP_ID}`,
      };
      mockOidcIdpService.getDiscoveryMetadata.mockResolvedValue(metadata);

      const result = await controller.getDiscovery(TEST_ORG_ID, TEST_APP_ID);

      expect(result).toEqual(metadata);
      expect(mockOidcIdpService.getDiscoveryMetadata).toHaveBeenCalledWith(TEST_ORG_ID, TEST_APP_ID);
    });
  });

  // ── authorize ─────────────────────────────────────────────────────────

  describe('authorize', () => {
    it('should redirect unauthenticated user to frontend login', async () => {
      const req = createMockReq();
      const res = createMockRes();

      await controller.authorize(TEST_ORG_ID, TEST_APP_ID, req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3001/login?returnUrl='),
      );
    });

    it('should dispatch to provider when user is authenticated', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockOidcIdpService.dispatchToProvider.mockResolvedValue(undefined);

      await controller.authorize(TEST_ORG_ID, TEST_APP_ID, req, res);

      expect(mockOidcIdpService.dispatchToProvider).toHaveBeenCalledWith(
        TEST_ORG_ID,
        TEST_APP_ID,
        req,
        res,
      );
    });
  });

  // ── Koa dispatch routes ────────────────────────────────

  describe('Koa dispatch routes', () => {
    it('should dispatch token request to provider', async () => {
      const req = createMockReq();
      const res = createMockRes();
      await controller.token(TEST_ORG_ID, TEST_APP_ID, req, res);
      expect(mockOidcIdpService.dispatchToProvider).toHaveBeenCalledWith(TEST_ORG_ID, TEST_APP_ID, req, res);
    });
  });

  describe('Interaction UI', () => {
    it('should confirm interaction', async () => {
      const req = createMockReq({ headers: { authorization: 'Bearer valid-token' } });
      const res = createMockRes();
      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockOidcIdpService.handleInteraction.mockResolvedValue('https://example.com/callback');

      await controller.confirmInteraction(TEST_ORG_ID, TEST_APP_ID, 'uid-123', { consent: true }, req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, redirectTo: 'https://example.com/callback' });
    });
  });
});
