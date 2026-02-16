import { Test, TestingModule } from '@nestjs/testing';
import { SsoService } from './sso.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationService } from '../organization/organization.service';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrgRole, SsoProtocol } from '@prisma/client';

describe('SsoService', () => {
  let service: SsoService;
  let prismaService: jest.Mocked<PrismaService>;
  let organizationService: jest.Mocked<OrganizationService>;

  const mockPrismaService = {
    ssoProvider: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockOrganizationService = {
    checkPermission: jest.fn(),
  };

  beforeEach(async () => {
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-bytes-long!';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SsoService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: OrganizationService,
          useValue: mockOrganizationService,
        },
      ],
    }).compile();

    service = module.get<SsoService>(SsoService);
    prismaService = module.get(PrismaService);
    organizationService = module.get(OrganizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create SAML SSO provider', async () => {
      const dto = {
        name: 'Okta SAML',
        type: 'ENTERPRISE' as any,
        protocol: SsoProtocol.SAML2,
        samlEntityId: 'https://okta.com/entity',
        samlSsoUrl: 'https://okta.com/sso',
        samlCertificate: '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----',
      };

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.ssoProvider.create.mockResolvedValue({
        id: 'sso-1',
        name: dto.name,
        protocol: dto.protocol,
      } as any);

      const result = await service.create('org-1', 'actor-1', dto);

      expect(result.id).toBe('sso-1');
      expect(mockOrganizationService.checkPermission).toHaveBeenCalledWith(
        'org-1',
        'actor-1',
        [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN],
      );
    });

    it('should create OIDC SSO provider', async () => {
      const dto = {
        name: 'Auth0 OIDC',
        type: 'ENTERPRISE' as any,
        protocol: SsoProtocol.OIDC,
        oidcIssuer: 'https://auth0.com',
        oidcClientId: 'client-123',
        oidcClientSecret: 'secret-123',
      };

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.ssoProvider.create.mockResolvedValue({
        id: 'sso-1',
        name: dto.name,
        protocol: dto.protocol,
      } as any);

      const result = await service.create('org-1', 'actor-1', dto);

      expect(result.id).toBe('sso-1');
    });

    it('should throw BadRequestException for incomplete SAML config', async () => {
      const dto = {
        name: 'Incomplete SAML',
        type: 'ENTERPRISE' as any,
        protocol: SsoProtocol.SAML2,
        samlEntityId: 'https://okta.com/entity',
        // Missing required fields
      };

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      await expect(service.create('org-1', 'actor-1', dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for incomplete OIDC config', async () => {
      const dto = {
        name: 'Incomplete OIDC',
        type: 'ENTERPRISE' as any,
        protocol: SsoProtocol.OIDC,
        oidcIssuer: 'https://auth0.com',
        // Missing clientId and clientSecret
      };

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      await expect(service.create('org-1', 'actor-1', dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should list all SSO providers', async () => {
      const mockProviders = [
        {
          id: 'sso-1',
          name: 'Provider 1',
          protocol: SsoProtocol.SAML2,
          enabled: true,
        },
        {
          id: 'sso-2',
          name: 'Provider 2',
          protocol: SsoProtocol.OIDC,
          enabled: true,
        },
      ];

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.ssoProvider.findMany.mockResolvedValue(
        mockProviders as any,
      );

      const result = await service.findAll('org-1', 'actor-1');

      expect(result).toEqual(mockProviders);
    });
  });

  describe('findOne', () => {
    it('should find SSO provider by id', async () => {
      const mockProvider = {
        id: 'sso-1',
        organizationId: 'org-1',
        name: 'Test Provider',
        protocol: SsoProtocol.SAML2,
        samlCertificate: 'encrypted-cert',
      };

      mockPrismaService.ssoProvider.findUnique.mockResolvedValue(
        mockProvider as any,
      );
      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      const result = await service.findOne('sso-1', 'actor-1');

      expect(result.id).toBe('sso-1');
      // Should not return encrypted certificate
      expect(result).not.toHaveProperty('samlCertificate');
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockPrismaService.ssoProvider.findUnique.mockResolvedValue(null);

      await expect(service.findOne('sso-1', 'actor-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update SSO provider', async () => {
      const dto = {
        name: 'Updated Provider',
        enabled: false,
      };

      mockPrismaService.ssoProvider.findUnique.mockResolvedValue({
        id: 'sso-1',
        organizationId: 'org-1',
      } as any);

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.ssoProvider.update.mockResolvedValue({
        id: 'sso-1',
        name: dto.name,
        enabled: dto.enabled,
      } as any);

      const result = await service.update('sso-1', 'actor-1', dto);

      expect(result.name).toBe('Updated Provider');
      expect(result.enabled).toBe(false);
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockPrismaService.ssoProvider.findUnique.mockResolvedValue(null);

      await expect(
        service.update('sso-1', 'actor-1', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete SSO provider', async () => {
      mockPrismaService.ssoProvider.findUnique.mockResolvedValue({
        id: 'sso-1',
        organizationId: 'org-1',
      } as any);

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.ssoProvider.delete.mockResolvedValue({} as any);

      await service.remove('sso-1', 'actor-1');

      expect(mockPrismaService.ssoProvider.delete).toHaveBeenCalledWith({
        where: { id: 'sso-1' },
      });
    });

    it('should require OWNER or ADMIN role', async () => {
      mockPrismaService.ssoProvider.findUnique.mockResolvedValue({
        id: 'sso-1',
        organizationId: 'org-1',
      } as any);

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      await service.remove('sso-1', 'actor-1');

      expect(mockOrganizationService.checkPermission).toHaveBeenCalledWith(
        'org-1',
        'actor-1',
        [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN],
      );
    });
  });

  describe('discoverByDomain', () => {
    it('should find SSO providers by email domain', async () => {
      const mockProviders = [
        {
          id: 'sso-1',
          name: 'Company SSO',
          type: 'ENTERPRISE',
          protocol: SsoProtocol.SAML2,
          organizationId: 'org-1',
        },
      ];

      mockPrismaService.ssoProvider.findMany.mockResolvedValue(
        mockProviders as any,
      );

      const result = await service.discoverByDomain('example.com');

      expect(result).toEqual(mockProviders);
      expect(mockPrismaService.ssoProvider.findMany).toHaveBeenCalledWith({
        where: {
          enabled: true,
          allowedDomains: {
            has: 'example.com',
          },
        },
        select: {
          id: true,
          name: true,
          type: true,
          protocol: true,
          organizationId: true,
        },
      });
    });
  });

  describe('findEnabledProviders', () => {
    it('should return only enabled providers', async () => {
      const mockProviders = [
        {
          id: 'sso-1',
          name: 'Provider 1',
          type: 'ENTERPRISE',
          protocol: SsoProtocol.SAML2,
        },
      ];

      mockPrismaService.ssoProvider.findMany.mockResolvedValue(
        mockProviders as any,
      );

      const result = await service.findEnabledProviders('org-1');

      expect(result).toEqual(mockProviders);
      expect(mockPrismaService.ssoProvider.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          enabled: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
          protocol: true,
        },
      });
    });
  });

  describe('testConnection', () => {
    it('should test SAML provider connection', async () => {
      const mockProvider = {
        id: 'sso-1',
        organizationId: 'org-1',
        protocol: 'SAML2',
        samlCertificate: 'encrypted-cert',
        samlSsoUrl: 'https://okta.com/sso',
      };

      mockPrismaService.ssoProvider.findUnique.mockResolvedValue(
        mockProvider as any,
      );
      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      // Mock the service's decrypt method to return a valid certificate
      const originalDecrypt = (service as any).decrypt;
      (service as any).decrypt = jest.fn().mockReturnValue(
        '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----',
      );

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const result = await service.testConnection('sso-1', 'actor-1');

      expect(result.checks).toBeDefined();
      expect(Array.isArray(result.checks)).toBe(true);

      (service as any).decrypt = originalDecrypt;
    });

    it('should test OIDC provider connection', async () => {
      const mockProvider = {
        id: 'sso-1',
        organizationId: 'org-1',
        protocol: 'OIDC',
        oidcIssuer: 'https://auth0.com',
        oidcClientId: 'client-123',
        oidcClientSecret: 'encrypted-secret',
      };

      mockPrismaService.ssoProvider.findUnique.mockResolvedValue(
        mockProvider as any,
      );
      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          authorization_endpoint: 'https://auth0.com/authorize',
        }),
      });

      const result = await service.testConnection('sso-1', 'actor-1');

      expect(result.checks).toBeDefined();
      expect(result.checks.some((c: any) => c.name === 'OIDC Discovery')).toBe(
        true,
      );
    });
  });

  describe('encryption/decryption', () => {
    it('should encrypt and decrypt data', () => {
      const plaintext = 'sensitive-data';
      
      // Access private method for testing
      const encrypted = (service as any).encrypt(plaintext);
      const decrypted = (service as any).decrypt(encrypted);

      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it('should generate different ciphertext for same plaintext', () => {
      const plaintext = 'sensitive-data';
      
      const encrypted1 = (service as any).encrypt(plaintext);
      const encrypted2 = (service as any).encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });
});
