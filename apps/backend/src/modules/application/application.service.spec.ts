import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationService } from './application.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationService } from '../organization/organization.service';
import { ApplicationUtils } from './utils/application.utils';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
// @ts-ignore - OrgRole type may not match at compile time
import { OrgRole } from '@prisma/client';

describe('ApplicationService', () => {
  let service: ApplicationService;
  let prismaService: jest.Mocked<PrismaService>;
  let organizationService: jest.Mocked<OrganizationService>;

  const mockPrismaService = {
    application: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
  };

  const mockOrganizationService = {
    checkPermission: jest.fn(),
  };

  const mockApplicationUtils = {
    generateClientId: jest.fn().mockReturnValue('app_test123'),
    generateClientSecret: jest.fn().mockReturnValue('sk_secret456'),
    hashSecret: jest.fn().mockReturnValue('hashed_secret'),
    generateSamlCertificates: jest.fn().mockReturnValue({
      privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
      certificate: '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: OrganizationService,
          useValue: mockOrganizationService,
        },
        {
          provide: ApplicationUtils,
          useValue: mockApplicationUtils,
        },
      ],
    }).compile();

    service = module.get<ApplicationService>(ApplicationService);
    prismaService = module.get(PrismaService);
    organizationService = module.get(OrganizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create OIDC application with credentials', async () => {
      const dto = {
        name: 'Test App',
        description: 'Test description',
        type: 'OIDC' as any,
        redirectUris: ['https://example.com/callback'],
      };

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        maxApplications: 10,
        _count: { applications: 5 },
      } as any);

      mockPrismaService.application.create.mockResolvedValue({
        id: 'app-1',
        ...dto,
        clientId: 'app_test123',
        clientSecretHash: 'hashed_secret',
      } as any);

      const result = await service.create('org-1', 'actor-1', dto);

      expect(result.id).toBe('app-1');
      expect(result.clientSecret).toBe('sk_secret456');
      expect(mockApplicationUtils.generateClientId).toHaveBeenCalled();
      expect(mockApplicationUtils.generateClientSecret).toHaveBeenCalled();
      expect(mockApplicationUtils.hashSecret).toHaveBeenCalledWith('sk_secret456');
      expect(mockOrganizationService.checkPermission).toHaveBeenCalledWith(
        'org-1',
        'actor-1',
        [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN, OrgRole.APP_ADMIN],
      );
    });

    it('should create SAML application with certificates', async () => {
      const dto = {
        name: 'SAML App',
        type: 'SAML' as any,
        samlSpEntityId: 'https://sp.example.com',
        samlSpAcsUrl: 'https://sp.example.com/acs',
      };

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        maxApplications: 10,
        _count: { applications: 2 },
      } as any);

      mockPrismaService.application.create.mockResolvedValue({
        id: 'app-2',
        ...dto,
        samlCertificate: '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----',
      } as any);

      const result = await service.create('org-1', 'actor-1', dto);

      expect(result.id).toBe('app-2');
      expect(mockApplicationUtils.generateSamlCertificates).toHaveBeenCalled();
      expect(mockApplicationUtils.generateClientId).not.toHaveBeenCalled();
    });

    it('should not generate secret for public OIDC client', async () => {
      const dto = {
        name: 'Public SPA',
        type: 'OIDC' as any,
        isPublicClient: true,
        redirectUris: ['https://spa.example.com/callback'],
      };

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        maxApplications: 10,
        _count: { applications: 1 },
      } as any);

      mockPrismaService.application.create.mockResolvedValue({
        id: 'app-3',
        ...dto,
        clientId: 'app_test123',
      } as any);

      const result = await service.create('org-1', 'actor-1', dto);

      expect(mockApplicationUtils.generateClientId).toHaveBeenCalled();
      expect(mockApplicationUtils.generateClientSecret).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if app limit reached', async () => {
      const dto = {
        name: 'Test App',
        type: 'OIDC' as any,
        redirectUris: ['https://example.com/callback'],
      };

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        maxApplications: 5,
        _count: { applications: 5 },
      } as any);

      await expect(service.create('org-1', 'actor-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if organization not found', async () => {
      const dto = {
        name: 'Test App',
        type: 'OIDC' as any,
        redirectUris: ['https://example.com/callback'],
      };

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.create('org-1', 'actor-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all applications for organization', async () => {
      const mockApps = [
        { id: 'app-1', name: 'App 1', clientId: 'client-1', status: 'ACTIVE' },
        { id: 'app-2', name: 'App 2', clientId: 'client-2', status: 'ACTIVE' },
      ];

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.application.findMany.mockResolvedValue(mockApps as any);

      const result = await service.findAll('org-1', 'actor-1');

      expect(result).toEqual(mockApps);
      expect(mockPrismaService.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: 'org-1',
            status: { not: 'ARCHIVED' },
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return application by id', async () => {
      const mockApp = {
        id: 'app-1',
        organizationId: 'org-1',
        name: 'Test App',
        clientId: 'client-1',
      };

      mockPrismaService.application.findUnique.mockResolvedValue(mockApp as any);
      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      const result = await service.findOne('app-1', 'actor-1');

      expect(result).toEqual(mockApp);
    });

    it('should throw NotFoundException if app not found', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.findOne('app-1', 'actor-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update application settings', async () => {
      const dto = {
        name: 'Updated App',
        description: 'Updated description',
      };

      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 'app-1',
        organizationId: 'org-1',
      } as any);

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      mockPrismaService.application.update.mockResolvedValue({
        id: 'app-1',
        ...dto,
      } as any);

      const result = await service.update('app-1', 'actor-1', dto);

      expect(result.name).toBe('Updated App');
      expect(mockOrganizationService.checkPermission).toHaveBeenCalledWith(
        'org-1',
        'actor-1',
        [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN, OrgRole.APP_ADMIN],
      );
    });

    it('should throw NotFoundException if app not found', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(
        service.update('app-1', 'actor-1', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('rotateSecret', () => {
    it('should rotate client secret for OIDC app', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 'app-1',
        organizationId: 'org-1',
        clientId: 'client-1',
        type: 'OIDC',
      } as any);

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.application.update.mockResolvedValue({} as any);

      const result = await service.rotateSecret('app-1', 'actor-1');

      expect(result.clientSecret).toBe('sk_secret456');
      expect(result.message).toContain('rotated successfully');
      expect(mockApplicationUtils.generateClientSecret).toHaveBeenCalled();
      expect(mockApplicationUtils.hashSecret).toHaveBeenCalledWith('sk_secret456');
      expect(mockOrganizationService.checkPermission).toHaveBeenCalledWith(
        'org-1',
        'actor-1',
        [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN],
      );
    });

    it('should throw NotFoundException if app not found', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.rotateSecret('app-1', 'actor-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should archive application', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 'app-1',
        organizationId: 'org-1',
      } as any);

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.application.update.mockResolvedValue({
        id: 'app-1',
        status: 'ARCHIVED',
      } as any);

      const result = await service.remove('app-1', 'actor-1');

      expect(result.status).toBe('ARCHIVED');
      expect(mockPrismaService.application.update).toHaveBeenCalledWith({
        where: { id: 'app-1' },
        data: { status: 'ARCHIVED' },
      });
    });

    it('should require OWNER or ADMIN role', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 'app-1',
        organizationId: 'org-1',
      } as any);

      mockOrganizationService.checkPermission.mockResolvedValue({} as any);
      mockPrismaService.application.update.mockResolvedValue({
        id: 'app-1',
        status: 'ARCHIVED',
      } as any);

      await service.remove('app-1', 'actor-1');

      expect(mockOrganizationService.checkPermission).toHaveBeenCalledWith(
        'org-1',
        'actor-1',
        [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN],
      );
    });
  });
});
