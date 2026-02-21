/**
 * SAML IdP Controller Tests
 *
 * Covers: metadata endpoint, SSO GET/POST bindings,
 * authentication checks, auto-submit form generation, XSS escaping.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SamlIdpController } from './saml-idp.controller';
import { SamlIdpService } from '../services/saml-idp.service';
import { AuthService } from '../../auth/services/auth.service';

describe('SamlIdpController', () => {
  let controller: SamlIdpController;

  const TEST_ORG_ID = '22843968-59d7-4488-9ef2-f9f720945b57';
  const TEST_USER = {
    id: 'usr_a1b2c3d4e5f6',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockSamlIdpService = {
    getIdpMetadata: jest.fn(),
    parseAuthnRequest: jest.fn(),
    verifyUserAccess: jest.fn(),
    createSamlResponse: jest.fn(),
  };

  const mockAuthService = {
    verifyAccessToken: jest.fn(),
    getUserById: jest.fn(),
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
      originalUrl: `/api/v1/sso/saml-idp/${TEST_ORG_ID}/sso?SAMLRequest=test`,
      ...overrides,
    };
  }

  function createMockRes(): any {
    return {
      redirect: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      set: jest.fn(),
    };
  }

  // ── Setup ─────────────────────────────────────────────────────────────

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = 'http://localhost:3001';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SamlIdpController],
      providers: [
        { provide: SamlIdpService, useValue: mockSamlIdpService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<SamlIdpController>(SamlIdpController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── getMetadata ───────────────────────────────────────────────────────

  describe('getMetadata', () => {
    it('should return XML metadata with correct content-type', async () => {
      const res = createMockRes();
      mockSamlIdpService.getIdpMetadata.mockResolvedValue(
        '<EntityDescriptor>mock-metadata</EntityDescriptor>',
      );

      await controller.getMetadata(TEST_ORG_ID, res);

      expect(res.set).toHaveBeenCalledWith('Content-Type', 'application/samlmetadata+xml');
      expect(res.send).toHaveBeenCalledWith(
        '<EntityDescriptor>mock-metadata</EntityDescriptor>',
      );
    });

    it('should throw BadRequestException when service errors', async () => {
      const res = createMockRes();
      mockSamlIdpService.getIdpMetadata.mockRejectedValue(
        new Error('Organization not found'),
      );

      await expect(controller.getMetadata(TEST_ORG_ID, res)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── handleSsoGet (HTTP-Redirect binding) ──────────────────────────────

  describe('handleSsoGet', () => {
    const mockAuthnRequest = {
      id: '_req123',
      acsUrl: 'https://sp.example.com/acs',
      issuer: 'https://sp.example.com/entity',
    };

    it('should throw BadRequestException when SAMLRequest is missing', async () => {
      const req = createMockReq();
      const res = createMockRes();

      await expect(
        controller.handleSsoGet(TEST_ORG_ID, undefined as any, undefined, req, res),
      ).rejects.toThrow('SAMLRequest parameter is required');
    });

    it('should redirect unauthenticated user to frontend login with returnUrl', async () => {
      const req = createMockReq();
      const res = createMockRes();

      mockSamlIdpService.parseAuthnRequest.mockResolvedValue(mockAuthnRequest);

      await controller.handleSsoGet(
        TEST_ORG_ID,
        'base64-saml-request',
        undefined,
        req,
        res,
      );

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3001/login?returnUrl='),
      );
    });

    it('should throw when user has no access to the application', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockSamlIdpService.parseAuthnRequest.mockResolvedValue(mockAuthnRequest);
      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockSamlIdpService.verifyUserAccess.mockResolvedValue(false);

      await expect(
        controller.handleSsoGet(
          TEST_ORG_ID,
          'base64-saml-request',
          undefined,
          req,
          res,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return auto-submit HTML form for authenticated user with access', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockSamlIdpService.parseAuthnRequest.mockResolvedValue(mockAuthnRequest);
      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockSamlIdpService.verifyUserAccess.mockResolvedValue(true);
      mockSamlIdpService.createSamlResponse.mockResolvedValue({
        samlResponse: 'base64-saml-response',
        relayState: 'relay-state-123',
      });

      await controller.handleSsoGet(
        TEST_ORG_ID,
        'base64-saml-request',
        'relay-state-123',
        req,
        res,
      );

      expect(res.send).toHaveBeenCalled();
      const html = res.send.mock.calls[0][0] as string;
      expect(html).toContain('<form method="post"');
      expect(html).toContain('name="SAMLResponse"');
      expect(html).toContain('base64-saml-response');
      expect(html).toContain('name="RelayState"');
      expect(html).toContain('relay-state-123');
      expect(html).toContain('document.forms[0].submit()');
    });

    it('should omit RelayState input when relayState is undefined', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockSamlIdpService.parseAuthnRequest.mockResolvedValue(mockAuthnRequest);
      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockSamlIdpService.verifyUserAccess.mockResolvedValue(true);
      mockSamlIdpService.createSamlResponse.mockResolvedValue({
        samlResponse: 'base64-saml-response',
        relayState: undefined,
      });

      await controller.handleSsoGet(
        TEST_ORG_ID,
        'base64-saml-request',
        undefined,
        req,
        res,
      );

      const html = res.send.mock.calls[0][0] as string;
      expect(html).not.toContain('name="RelayState"');
    });

    it('should escape HTML entities in form output (XSS prevention)', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      // ACS URL containing characters that need escaping
      const maliciousAuthnRequest = {
        id: '_req123',
        acsUrl: 'https://sp.example.com/acs?foo=bar&baz="test"',
        issuer: 'https://sp.example.com',
      };

      mockSamlIdpService.parseAuthnRequest.mockResolvedValue(maliciousAuthnRequest);
      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockSamlIdpService.verifyUserAccess.mockResolvedValue(true);
      mockSamlIdpService.createSamlResponse.mockResolvedValue({
        samlResponse: 'response<script>alert(1)</script>',
        relayState: undefined,
      });

      await controller.handleSsoGet(
        TEST_ORG_ID,
        'base64-saml-request',
        undefined,
        req,
        res,
      );

      const html = res.send.mock.calls[0][0] as string;
      // Escaped entities — raw & < > " should not appear unescaped
      expect(html).toContain('&amp;');
      expect(html).toContain('&quot;');
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });
  });

  // ── handleSsoPost (HTTP-POST binding) ─────────────────────────────────

  describe('handleSsoPost', () => {
    const mockAuthnRequest = {
      id: '_req456',
      acsUrl: 'https://sp.example.com/acs',
      issuer: 'https://sp.example.com/entity',
    };

    it('should throw BadRequestException when SAMLRequest is missing', async () => {
      const req = createMockReq();
      const res = createMockRes();

      await expect(
        controller.handleSsoPost(TEST_ORG_ID, undefined as any, undefined, req, res),
      ).rejects.toThrow('SAMLRequest parameter is required');
    });

    it('should redirect unauthenticated user to frontend login', async () => {
      const req = createMockReq();
      const res = createMockRes();

      mockSamlIdpService.parseAuthnRequest.mockResolvedValue(mockAuthnRequest);

      await controller.handleSsoPost(
        TEST_ORG_ID,
        'base64-saml-request',
        undefined,
        req,
        res,
      );

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3001/login?returnUrl='),
      );
    });

    it('should return auto-submit HTML form for authenticated user via POST binding', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockSamlIdpService.parseAuthnRequest.mockResolvedValue(mockAuthnRequest);
      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockSamlIdpService.verifyUserAccess.mockResolvedValue(true);
      mockSamlIdpService.createSamlResponse.mockResolvedValue({
        samlResponse: 'base64-post-response',
        relayState: 'post-relay',
      });

      await controller.handleSsoPost(
        TEST_ORG_ID,
        'base64-saml-request',
        'post-relay',
        req,
        res,
      );

      const html = res.send.mock.calls[0][0] as string;
      expect(html).toContain('<form method="post"');
      expect(html).toContain('base64-post-response');
      expect(html).toContain('post-relay');
    });

    it('should throw when user has no access via POST binding', async () => {
      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      mockSamlIdpService.parseAuthnRequest.mockResolvedValue(mockAuthnRequest);
      mockAuthService.verifyAccessToken.mockResolvedValue({ sub: TEST_USER.id });
      mockAuthService.getUserById.mockResolvedValue(TEST_USER);
      mockSamlIdpService.verifyUserAccess.mockResolvedValue(false);

      await expect(
        controller.handleSsoPost(
          TEST_ORG_ID,
          'base64-saml-request',
          undefined,
          req,
          res,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
