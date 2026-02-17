import { Test, TestingModule } from '@nestjs/testing';
import { PolicyService } from './policy.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';
import { PolicyEffect, OrgRole } from '@prisma/client';
import { OrganizationService } from '../organization/organization.service';

describe('PolicyService', () => {
  let service: PolicyService;
  let prismaService: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;
  let organizationService: jest.Mocked<OrganizationService>;

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    passwordPolicy: {
      upsert: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    policy: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    networkZone: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockOrganizationService = {
    checkPermission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: OrganizationService,
          useValue: mockOrganizationService,
        },
      ],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
    prismaService = module.get(PrismaService);
    auditService = module.get(AuditService);
    organizationService = module.get(OrganizationService);
    mockPrismaService.organization.findUnique.mockResolvedValue({ id: 'org-1' } as any);
    mockPrismaService.passwordPolicy.upsert.mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a policy', async () => {
      const data = {
        name: 'Test Policy',
        resource: 'api:users:*',
        actions: ['read', 'write'],
        effect: PolicyEffect.ALLOW,
      };

      mockPrismaService.policy.create.mockResolvedValue({
        id: 'policy-1',
        ...data,
      } as any);

      const result = await service.create('org-1', 'user-1', data);

      expect(result.id).toBe('policy-1');
      expect(mockPrismaService.policy.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          name: data.name,
          description: undefined,
          effect: PolicyEffect.ALLOW,
          type: 'ACCESS',
          resource: data.resource,
          actions: data.actions,
          conditions: {},
          rules: [],
          priority: 0,
          enabled: true,
        },
      });
    });

    it('should apply default values', async () => {
      const data = {
        name: 'Test Policy',
        resource: 'api:users:*',
        actions: ['read'],
      };

      mockPrismaService.policy.create.mockResolvedValue({
        id: 'policy-1',
        ...data,
        effect: PolicyEffect.ALLOW,
      } as any);

      await service.create('org-1', 'user-1', data);

      expect(mockPrismaService.policy.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            effect: PolicyEffect.ALLOW,
            priority: 0,
            enabled: true,
            conditions: {},
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should list all policies for organization', async () => {
      const mockPolicies = [
        { id: 'policy-1', name: 'Policy 1', priority: 1 },
        { id: 'policy-2', name: 'Policy 2', priority: 0 },
      ];

      mockPrismaService.policy.findMany.mockResolvedValue(mockPolicies as any);

      const result = await service.findAll('org-1', 'user-1');

      expect(result).toEqual(mockPolicies);
      expect(mockPrismaService.policy.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1' },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });
    });
  });

  describe('findOne', () => {
    it('should find a policy by id', async () => {
      const mockPolicy = { id: 'policy-1', name: 'Test Policy' };

      mockPrismaService.policy.findFirst.mockResolvedValue(mockPolicy as any);

      const result = await service.findOne('org-1', 'policy-1', 'user-1');

      expect(result).toEqual(mockPolicy);
    });

    it('should throw NotFoundException if policy not found', async () => {
      mockPrismaService.policy.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org-1', 'policy-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('evaluate', () => {
    it('should allow request matching ALLOW policy', async () => {
      const mockPolicies = [
        {
          id: 'policy-1',
          name: 'Allow Read Users',
          resource: 'api:users:*',
          actions: ['read'],
          effect: PolicyEffect.ALLOW,
          priority: 1,
          enabled: true,
          conditions: {},
        },
      ];

      mockPrismaService.policy.findMany.mockResolvedValue(mockPolicies as any);

      const result = await service.evaluate('org-1', {
        userId: 'user-1',
        resource: 'api:users:123',
        action: 'read',
      });

      expect(result.decision).toBe('ALLOW');
      expect(result.matchedPolicy?.id).toBe('policy-1');
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should deny request matching DENY policy', async () => {
      const mockPolicies = [
        {
          id: 'policy-1',
          name: 'Deny Delete',
          resource: 'api:users:*',
          actions: ['delete'],
          effect: PolicyEffect.DENY,
          priority: 2,
          enabled: true,
          conditions: {},
        },
        {
          id: 'policy-2',
          name: 'Allow All',
          resource: 'api:users:*',
          actions: ['*'],
          effect: PolicyEffect.ALLOW,
          priority: 1,
          enabled: true,
          conditions: {},
        },
      ];

      mockPrismaService.policy.findMany.mockResolvedValue(mockPolicies as any);

      const result = await service.evaluate('org-1', {
        userId: 'user-1',
        resource: 'api:users:123',
        action: 'delete',
      });

      expect(result.decision).toBe('DENY');
      expect(result.matchedPolicy?.id).toBe('policy-1');
    });

    it('should default to DENY when no policy matches', async () => {
      mockPrismaService.policy.findMany.mockResolvedValue([]);

      const result = await service.evaluate('org-1', {
        userId: 'user-1',
        resource: 'api:orders:123',
        action: 'read',
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('No matching policy found');
    });

    it('should match wildcard resource patterns', async () => {
      const mockPolicies = [
        {
          id: 'policy-1',
          name: 'Allow All Resources',
          resource: '*',
          actions: ['read'],
          effect: PolicyEffect.ALLOW,
          priority: 1,
          enabled: true,
          conditions: {},
        },
      ];

      mockPrismaService.policy.findMany.mockResolvedValue(mockPolicies as any);

      const result = await service.evaluate('org-1', {
        userId: 'user-1',
        resource: 'api:anything:123',
        action: 'read',
      });

      expect(result.decision).toBe('ALLOW');
    });

    it('should match wildcard actions', async () => {
      const mockPolicies = [
        {
          id: 'policy-1',
          name: 'Allow All Actions',
          resource: 'api:users:*',
          actions: ['*'],
          effect: PolicyEffect.ALLOW,
          priority: 1,
          enabled: true,
          conditions: {},
        },
      ];

      mockPrismaService.policy.findMany.mockResolvedValue(mockPolicies as any);

      const result = await service.evaluate('org-1', {
        userId: 'user-1',
        resource: 'api:users:123',
        action: 'delete',
      });

      expect(result.decision).toBe('ALLOW');
    });

    it('should evaluate IP range conditions', async () => {
      const mockPolicies = [
        {
          id: 'policy-1',
          name: 'Office Network Only',
          resource: 'api:users:*',
          actions: ['read'],
          effect: PolicyEffect.ALLOW,
          priority: 1,
          enabled: true,
          conditions: { ipRange: '192.168.1.0/24' },
        },
      ];

      mockPrismaService.policy.findMany.mockResolvedValue(mockPolicies as any);

      const result = await service.evaluate('org-1', {
        userId: 'user-1',
        resource: 'api:users:123',
        action: 'read',
        context: { ipAddress: '192.168.1.10' },
      });

      expect(result.decision).toBe('ALLOW');
    });

    it('should deny when IP not in allowed range', async () => {
      const mockPolicies = [
        {
          id: 'policy-1',
          name: 'Office Network Only',
          resource: 'api:users:*',
          actions: ['read'],
          effect: PolicyEffect.ALLOW,
          priority: 1,
          enabled: true,
          conditions: { ipRange: '192.168.1.0/24' },
        },
      ];

      mockPrismaService.policy.findMany.mockResolvedValue(mockPolicies as any);

      const result = await service.evaluate('org-1', {
        userId: 'user-1',
        resource: 'api:users:123',
        action: 'read',
        context: { ipAddress: '10.0.0.1' },
      });

      expect(result.decision).toBe('DENY');
    });

    it('should evaluate geo-location conditions', async () => {
      const mockPolicies = [
        {
          id: 'policy-1',
          name: 'US Only',
          resource: 'api:users:*',
          actions: ['read'],
          effect: PolicyEffect.ALLOW,
          priority: 1,
          enabled: true,
          conditions: { geoLocations: ['US', 'CA'] },
        },
      ];

      mockPrismaService.policy.findMany.mockResolvedValue(mockPolicies as any);

      const result = await service.evaluate('org-1', {
        userId: 'user-1',
        resource: 'api:users:123',
        action: 'read',
        context: { geoLocation: 'US' },
      });

      expect(result.decision).toBe('ALLOW');
    });

    it('should skip disabled policies', async () => {
      const mockPolicies = [
        {
          id: 'policy-1',
          name: 'Disabled Policy',
          resource: 'api:users:*',
          actions: ['read'],
          effect: PolicyEffect.ALLOW,
          priority: 1,
          enabled: false,
          conditions: {},
        },
      ];

      mockPrismaService.policy.findMany.mockResolvedValue([]);

      const result = await service.evaluate('org-1', {
        userId: 'user-1',
        resource: 'api:users:123',
        action: 'read',
      });

      expect(result.decision).toBe('DENY');
    });
  });

  describe('NetworkZone management', () => {
    it('should create network zone', async () => {
      const data = {
        name: 'Office Network',
        ipRanges: ['192.168.1.0/24'],
        trusted: true,
      };

      mockPrismaService.networkZone.create.mockResolvedValue({
        id: 'zone-1',
        ...data,
      } as any);

      const result = await service.createNetworkZone('org-1', 'user-1', data);

      expect(result.id).toBe('zone-1');
    });

    it('should list network zones', async () => {
      const mockZones = [
        { id: 'zone-1', name: 'Zone 1' },
        { id: 'zone-2', name: 'Zone 2' },
      ];

      mockPrismaService.networkZone.findMany.mockResolvedValue(
        mockZones as any,
      );

      const result = await service.findAllNetworkZones('org-1', 'user-1');

      expect(result).toEqual(mockZones);
    });

    it('should check if IP is trusted', async () => {
      const mockZones = [
        {
          id: 'zone-1',
          trusted: true,
          enabled: true,
          ipRanges: ['192.168.1.0/24'],
        },
      ];

      mockPrismaService.networkZone.findMany.mockResolvedValue(
        mockZones as any,
      );

      const result = await service.isIpTrusted('org-1', '192.168.1.10');

      expect(result).toBe(true);
    });

    it('should return false if IP not in trusted zones', async () => {
      const mockZones = [
        {
          id: 'zone-1',
          trusted: true,
          enabled: true,
          ipRanges: ['192.168.1.0/24'],
        },
      ];

      mockPrismaService.networkZone.findMany.mockResolvedValue(
        mockZones as any,
      );

      const result = await service.isIpTrusted('org-1', '10.0.0.1');

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a policy', async () => {
      mockPrismaService.policy.findFirst.mockResolvedValue({
        id: 'policy-1',
      } as any);
      mockPrismaService.policy.delete.mockResolvedValue({} as any);

      const result = await service.delete('org-1', 'policy-1', 'user-1');

      expect(result.message).toContain('deleted successfully');
      expect(mockPrismaService.policy.delete).toHaveBeenCalledWith({
        where: { id: 'policy-1' },
      });
    });
  });
});
