import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationSettingsService } from './organization-settings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationService } from '../organization.service';
import { OrgRole } from '@prisma/client';

describe('OrganizationSettingsService', () => {
    let service: OrganizationSettingsService;
    let prisma: jest.Mocked<PrismaService>;
    let organizationService: jest.Mocked<OrganizationService>;

    const mockPrisma = {
        organizationSetting: {
            findMany: jest.fn(),
            upsert: jest.fn(),
        },
        $transaction: jest.fn(),
    };

    const mockOrganizationService = {
        checkPermission: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrganizationSettingsService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
                {
                    provide: OrganizationService,
                    useValue: mockOrganizationService,
                },
            ],
        }).compile();

        service = module.get<OrganizationSettingsService>(OrganizationSettingsService);
        prisma = module.get(PrismaService);
        organizationService = module.get(OrganizationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return settings if user has permission', async () => {
            const orgId = 'org-1';
            const actorId = 'actor-1';
            const mockSettings = [
                { key: 'setting1', value: 'value1' },
                { key: 'setting2', value: 'value2' },
            ];

            mockOrganizationService.checkPermission.mockResolvedValue({} as any);
            mockPrisma.organizationSetting.findMany.mockResolvedValue(mockSettings);

            const result = await service.findAll(orgId, actorId);

            expect(result).toEqual({
                setting1: 'value1',
                setting2: 'value2',
            });
            expect(mockOrganizationService.checkPermission).toHaveBeenCalledWith(orgId, actorId, [
                OrgRole.SUPER_ADMIN,
                OrgRole.ORG_ADMIN,
            ]);
        });
    });

    describe('update', () => {
        it('should update a setting if user has permission', async () => {
            const orgId = 'org-1';
            const actorId = 'actor-1';
            const key = 'key1';
            const value = 'val1';

            mockOrganizationService.checkPermission.mockResolvedValue({} as any);
            mockPrisma.organizationSetting.upsert.mockResolvedValue({} as any);

            await service.update(orgId, actorId, key, value);

            expect(mockPrisma.organizationSetting.upsert).toHaveBeenCalledWith({
                where: {
                    organizationId_key: {
                        organizationId: orgId,
                        key,
                    },
                },
                update: {
                    value,
                    updatedBy: actorId,
                },
                create: {
                    organizationId: orgId,
                    key,
                    value,
                    updatedBy: actorId,
                },
            });
        });
    });

    describe('updateBatch', () => {
        it('should update multiple settings in a transaction', async () => {
            const orgId = 'org-1';
            const actorId = 'actor-1';
            const settings = {
                key1: 'val1',
                key2: 'val2',
            };

            mockOrganizationService.checkPermission.mockResolvedValue({} as any);
            mockPrisma.$transaction.mockResolvedValue([]);
            mockPrisma.organizationSetting.findMany.mockResolvedValue([]);

            await service.updateBatch(orgId, actorId, settings);

            expect(mockPrisma.$transaction).toHaveBeenCalled();
            expect(mockPrisma.organizationSetting.upsert).toHaveBeenCalledTimes(2);
        });
    });
});
