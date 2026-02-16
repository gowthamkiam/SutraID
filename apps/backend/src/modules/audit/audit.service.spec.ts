import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditResult } from '@prisma/client';
import { OrganizationService } from '../organization/organization.service';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: jest.Mocked<PrismaService>;
  let organizationService: jest.Mocked<OrganizationService>;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockOrganizationService = {
    checkPermission: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
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

    service = module.get<AuditService>(AuditService);
    prismaService = module.get(PrismaService);
    organizationService = module.get(OrganizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should log an audit event successfully', async () => {
      const event = {
        organizationId: 'org-1',
        userId: 'actor-1',
        action: 'user.login',
        resource: 'auth',
        result: 'SUCCESS' as AuditResult,
        metadata: { ip: '127.0.0.1' },
      };

      mockPrismaService.auditLog.create.mockResolvedValue(event as any);

      await service.log(event);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          userId: 'actor-1',
          agentId: null,
          action: 'user.login',
          resource: 'auth',
          result: 'SUCCESS',
          metadata: { ip: '127.0.0.1' },
          riskScore: null,
        },
      });
    });

    it('should handle missing optional fields', async () => {
      const event = {
        action: 'system.startup',
      };

      mockPrismaService.auditLog.create.mockResolvedValue(event as any);

      await service.log(event);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          organizationId: null,
          userId: null,
          agentId: null,
          action: 'system.startup',
          resource: null,
          result: 'SUCCESS',
          metadata: {},
          riskScore: null,
        },
      });
    });

    it('should not throw error when logging fails', async () => {
      const event = { action: 'test.action' };
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      mockPrismaService.auditLog.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.log(event)).resolves.not.toThrow();
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('query', () => {
    it('should query audit logs with filters', async () => {
      const mockLogs = [
        { id: '1', action: 'user.login', createdAt: new Date() },
        { id: '2', action: 'user.logout', createdAt: new Date() },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(2);
      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      const result = await service.query('org-1', 'actor-1', {
        userId: 'actor-1',
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        logs: mockLogs,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          userId: 'actor-1',
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle date range filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);
      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      await service.query('org-1', 'actor-1', {
        startDate,
        endDate,
      });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: startDate, lte: endDate },
          }),
        }),
      );
    });

    it('should paginate results correctly', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(100);
      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      const result = await service.query('org-1', 'actor-1', {
        page: 3,
        limit: 20,
      });

      expect(result.totalPages).toBe(5);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        }),
      );
    });
  });

  describe('getStats', () => {
    it('should return audit statistics', async () => {
      const mockByAction = [
        { action: 'user.login', _count: 10 },
        { action: 'user.logout', _count: 8 },
      ];

      const mockByResult = [
        { result: 'SUCCESS', _count: 15 },
        { result: 'FAILURE', _count: 3 },
      ];

      mockPrismaService.auditLog.count.mockResolvedValue(18);
      mockPrismaService.auditLog.groupBy
        .mockResolvedValueOnce(mockByAction as any)
        .mockResolvedValueOnce(mockByResult as any);
      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      const result = await service.getStats('org-1', 'actor-1', 30);

      expect(result).toEqual({
        totalEvents: 18,
        byAction: [
          { action: 'user.login', count: 10 },
          { action: 'user.logout', count: 8 },
        ],
        byResult: [
          { result: 'SUCCESS', count: 15 },
          { result: 'FAILURE', count: 3 },
        ],
        periodDays: 30,
      });
    });

    it('should filter by date range', async () => {
      mockPrismaService.auditLog.count.mockResolvedValue(0);
      mockPrismaService.auditLog.groupBy.mockResolvedValue([]);
      mockOrganizationService.checkPermission.mockResolvedValue({} as any);

      await service.getStats('org-1', 'actor-1', 7);

      const expectedDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const callArgs = mockPrismaService.auditLog.count.mock.calls[0][0];

      expect(callArgs.where.createdAt.gte.getTime()).toBeCloseTo(
        expectedDate.getTime(),
        -2,
      );
    });
  });
});
