import { Test, TestingModule } from '@nestjs/testing';
import { SamlSpService } from './saml-sp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SsoService } from '../sso.service';
import { BadRequestException } from '@nestjs/common';

// Mock the SAML library
jest.mock('@node-saml/passport-saml', () => ({
  SAML: jest.fn().mockImplementation(() => ({
    getAuthorizeUrlAsync: jest.fn(),
    validatePostResponseAsync: jest.fn(),
  })),
}));

describe('SamlSpService', () => {
  let service: SamlSpService;
  let prismaService: jest.Mocked<PrismaService>;
  let ssoService: jest.Mocked<SsoService>;

  const mockPrismaService = {
    ssoProvider: {
      findUnique: jest.fn(),
    },
    ssoIdentity: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
  };

  const mockSsoService = {
    getProviderWithSecrets: jest.fn(),
  };

  const mockProvider = {
    id: 'provider-1',
    organizationId: 'org-1',
    samlEntityId: 'https://idp.example.com/entity',
    samlSsoUrl: 'https://idp.example.com/sso',
    samlCertificate: '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----',
    autoProvision: true,
    allowedDomains: ['example.com'],
    oidcIssuer: null,
  };

  beforeEach(async () => {
    process.env.BACKEND_URL = 'http://localhost:3000';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SamlSpService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SsoService,
          useValue: mockSsoService,
        },
      ],
    }).compile();

    service = module.get<SamlSpService>(SamlSpService);
    prismaService = module.get(PrismaService);
    ssoService = module.get(SsoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLoginUrl', () => {
    it('should generate SAML login URL', async () => {
      mockSsoService.getProviderWithSecrets.mockResolvedValue(mockProvider);

      const { SAML } = require('@node-saml/passport-saml');
      SAML.mockImplementation(() => ({
        getAuthorizeUrlAsync: jest.fn().mockResolvedValue('https://idp.example.com/sso?SAMLRequest=abc'),
      }));

      const result = await service.getLoginUrl('provider-1');

      expect(result).toBe('https://idp.example.com/sso?SAMLRequest=abc');
      expect(mockSsoService.getProviderWithSecrets).toHaveBeenCalledWith('provider-1');
    });

    it('should generate SAML login URL with relay state', async () => {
      mockSsoService.getProviderWithSecrets.mockResolvedValue(mockProvider);

      const { SAML } = require('@node-saml/passport-saml');
      const mockGetAuthorizeUrl = jest.fn().mockResolvedValue('https://idp.example.com/sso?SAMLRequest=abc');
      SAML.mockImplementation(() => ({
        getAuthorizeUrlAsync: mockGetAuthorizeUrl,
      }));

      const result = await service.getLoginUrl('provider-1', 'https://app.example.com/callback');

      expect(result).toBe('https://idp.example.com/sso?SAMLRequest=abc');
      expect(mockGetAuthorizeUrl).toHaveBeenCalledWith('https://app.example.com/callback', undefined, {});
    });

    it('should throw BadRequestException for invalid SAML configuration', async () => {
      mockSsoService.getProviderWithSecrets.mockResolvedValue({
        ...mockProvider,
        samlEntityId: null,
      });

      await expect(service.getLoginUrl('provider-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when SAML library fails', async () => {
      mockSsoService.getProviderWithSecrets.mockResolvedValue(mockProvider);

      const { SAML } = require('@node-saml/passport-saml');
      SAML.mockImplementation(() => ({
        getAuthorizeUrlAsync: jest.fn().mockRejectedValue(new Error('SAML error')),
      }));

      await expect(service.getLoginUrl('provider-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateSamlResponse', () => {
    it('should validate SAML response and extract user profile', async () => {
      mockSsoService.getProviderWithSecrets.mockResolvedValue(mockProvider);

      const mockProfile = {
        nameID: 'user-123',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const { SAML } = require('@node-saml/passport-saml');
      SAML.mockImplementation(() => ({
        validatePostResponseAsync: jest.fn().mockResolvedValue({ profile: mockProfile }),
      }));

      const result = await service.validateSamlResponse('provider-1', { SAMLResponse: 'base64data' });

      expect(result.externalId).toBe('user-123');
      expect(result.email).toBe('user@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('should extract email from claims format', async () => {
      mockSsoService.getProviderWithSecrets.mockResolvedValue(mockProvider);

      const mockProfile = {
        nameID: 'user-123',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'user@example.com',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname': 'Jane',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname': 'Smith',
      };

      const { SAML } = require('@node-saml/passport-saml');
      SAML.mockImplementation(() => ({
        validatePostResponseAsync: jest.fn().mockResolvedValue({ profile: mockProfile }),
      }));

      const result = await service.validateSamlResponse('provider-1', { SAMLResponse: 'base64data' });

      expect(result.email).toBe('user@example.com');
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
    });

    it('should throw BadRequestException when no profile returned', async () => {
      mockSsoService.getProviderWithSecrets.mockResolvedValue(mockProvider);

      const { SAML } = require('@node-saml/passport-saml');
      SAML.mockImplementation(() => ({
        validatePostResponseAsync: jest.fn().mockResolvedValue({ profile: null }),
      }));

      await expect(
        service.validateSamlResponse('provider-1', { SAMLResponse: 'base64data' }),
      ).rejects.toThrow('No profile returned from SAML response');
    });

    it('should throw BadRequestException when required attributes missing', async () => {
      mockSsoService.getProviderWithSecrets.mockResolvedValue(mockProvider);

      const { SAML } = require('@node-saml/passport-saml');
      SAML.mockImplementation(() => ({
        validatePostResponseAsync: jest.fn().mockResolvedValue({
          profile: { nameID: 'user-123' }, // Missing email
        }),
      }));

      await expect(
        service.validateSamlResponse('provider-1', { SAMLResponse: 'base64data' }),
      ).rejects.toThrow('SAML response missing required attributes');
    });

    it('should throw BadRequestException when validation fails', async () => {
      mockSsoService.getProviderWithSecrets.mockResolvedValue(mockProvider);

      const { SAML } = require('@node-saml/passport-saml');
      SAML.mockImplementation(() => ({
        validatePostResponseAsync: jest.fn().mockRejectedValue(new Error('Signature validation failed')),
      }));

      await expect(
        service.validateSamlResponse('provider-1', { SAMLResponse: 'invalid' }),
      ).rejects.toThrow('SAML validation failed');
    });
  });

  describe('getOrCreateSsoIdentity', () => {
    it('should return existing user when identity found', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com' };
      const mockIdentity = {
        id: 'identity-1',
        user: mockUser,
      };

      mockPrismaService.ssoProvider.findUnique.mockResolvedValue(mockProvider);
      mockPrismaService.ssoIdentity.findUnique.mockResolvedValue(mockIdentity);
      mockPrismaService.ssoIdentity.update.mockResolvedValue({
        ...mockIdentity,
        lastLoginAt: new Date(),
      });

      const result = await service.getOrCreateSsoIdentity(
        'provider-1',
        'external-123',
        'user@example.com',
        { role: 'admin' },
      );

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.ssoIdentity.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException when provider not found', async () => {
      mockPrismaService.ssoProvider.findUnique.mockResolvedValue(null);

      await expect(
        service.getOrCreateSsoIdentity('provider-1', 'external-123', 'user@example.com', {}),
      ).rejects.toThrow('SSO provider not found');
    });

    it('should throw when auto-provisioning disabled and user not found', async () => {
      mockPrismaService.ssoProvider.findUnique.mockResolvedValue({
        ...mockProvider,
        autoProvision: false,
      });
      mockPrismaService.ssoIdentity.findUnique.mockResolvedValue(null);

      await expect(
        service.getOrCreateSsoIdentity('provider-1', 'external-123', 'user@example.com', {}),
      ).rejects.toThrow('User does not exist and auto-provisioning is disabled');
    });

    it('should throw when email domain not allowed', async () => {
      mockPrismaService.ssoProvider.findUnique.mockResolvedValue({
        ...mockProvider,
        allowedDomains: ['company.com'],
      });
      mockPrismaService.ssoIdentity.findUnique.mockResolvedValue(null);

      await expect(
        service.getOrCreateSsoIdentity('provider-1', 'external-123', 'user@other.com', {}),
      ).rejects.toThrow('Email domain other.com is not allowed');
    });

    it('should create new user when auto-provisioning enabled', async () => {
      const mockNewUser = { id: 'user-new', email: 'newuser@example.com' };

      mockPrismaService.ssoProvider.findUnique.mockResolvedValue(mockProvider);
      mockPrismaService.ssoIdentity.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockNewUser);

      const result = await service.getOrCreateSsoIdentity(
        'provider-1',
        'external-123',
        'newuser@example.com',
        { firstName: 'New', lastName: 'User' },
      );

      expect(result).toEqual(mockNewUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'newuser@example.com',
            emailVerified: true,
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('should allow any domain when allowedDomains is empty', async () => {
      const mockNewUser = { id: 'user-new', email: 'user@anydomain.com' };

      mockPrismaService.ssoProvider.findUnique.mockResolvedValue({
        ...mockProvider,
        allowedDomains: [],
      });
      mockPrismaService.ssoIdentity.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockNewUser);

      const result = await service.getOrCreateSsoIdentity(
        'provider-1',
        'external-123',
        'user@anydomain.com',
        {},
      );

      expect(result).toEqual(mockNewUser);
    });
  });

  describe('getMetadata', () => {
    it('should generate valid SAML metadata XML', async () => {
      const result = await service.getMetadata();

      expect(result).toContain('<?xml version="1.0"?>');
      expect(result).toContain('EntityDescriptor');
      expect(result).toContain('SPSSODescriptor');
      expect(result).toContain('AssertionConsumerService');
      expect(result).toContain('http://localhost:3000/api/v1/sso/saml/acs');
      expect(result).toContain('http://localhost:3000/api/v1/sso/saml/metadata');
    });

    it('should use BACKEND_URL environment variable', async () => {
      process.env.BACKEND_URL = 'https://api.example.com';

      const result = await service.getMetadata();

      expect(result).toContain('https://api.example.com/api/v1/sso/saml/acs');
      expect(result).toContain('https://api.example.com/api/v1/sso/saml/metadata');
    });
  });
});
