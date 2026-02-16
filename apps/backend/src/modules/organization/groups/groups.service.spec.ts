import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationService } from '../organization.service';
import { OrgRole } from '@prisma/client';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

describe('GroupsService', () => {
    let service: GroupsService;
    let prismaService: jest.Mocked<PrismaService>;
    let orgService: jest.Mocked<OrganizationService>;

    const mockPrismaService = {
        group: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findFirst: jest.fn(),
        },
        organizationMember: {
            findMany: jest.fn(),
        },
        groupMember: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            createMany: jest.fn(),
            delete: jest.fn(),
        },
    };

    const mockOrgService = {
        checkPermission: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GroupsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: OrganizationService,
                    useValue: mockOrgService,
                },
            ],
        }).compile();

        service = module.get<GroupsService>(GroupsService);
        prismaService = module.get(PrismaService);
        orgService = module.get(OrganizationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('list', () => {
        it('should call checkPermission and return groups', async () => {
            mockOrgService.checkPermission.mockResolvedValue({} as any);
            mockPrismaService.group.findMany.mockResolvedValue([]);
            mockPrismaService.group.count.mockResolvedValue(0);

            await service.list('org-1', {}, 'actor-1');

            expect(mockOrgService.checkPermission).toHaveBeenCalledWith('org-1', 'actor-1', expect.arrayContaining([OrgRole.GROUP_MEMBERSHIP_ADMIN]));
        });
    });

    describe('create', () => {
        it('should allow authorized roles to create group', async () => {
            const dto = { name: 'New Group', description: 'Desc' };
            mockOrgService.checkPermission.mockResolvedValue({} as any);
            mockPrismaService.group.findUnique.mockResolvedValue(null);
            mockPrismaService.group.create.mockResolvedValue({ id: 'group-1', ...dto, _count: { members: 0 } } as any);

            const result = await service.create('org-1', dto, 'actor-1');

            expect(mockOrgService.checkPermission).toHaveBeenCalledWith('org-1', 'actor-1', [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN, OrgRole.GROUP_MEMBERSHIP_ADMIN]);
            expect(result.id).toBe('group-1');
        });
    });

    describe('update', () => {
        it('should allow GROUP_MEMBERSHIP_ADMIN to update group', async () => {
            const dto = { name: 'Updated' };
            mockOrgService.checkPermission.mockResolvedValue({} as any);
            mockPrismaService.group.findFirst.mockResolvedValue({ id: 'group-1', name: 'Old' } as any);
            mockPrismaService.group.findUnique.mockResolvedValue(null);
            mockPrismaService.group.update.mockResolvedValue({ id: 'group-1', name: 'Updated', _count: { members: 0 } } as any);

            await service.update('org-1', 'group-1', dto, 'actor-1');

            expect(mockOrgService.checkPermission).toHaveBeenCalledWith('org-1', 'actor-1', expect.arrayContaining([OrgRole.GROUP_MEMBERSHIP_ADMIN]));
        });
    });

    describe('remove', () => {
        it('should allow authorized roles to remove group', async () => {
            mockOrgService.checkPermission.mockResolvedValue({} as any);
            mockPrismaService.group.findFirst.mockResolvedValue({ id: 'group-1' } as any);

            await service.remove('org-1', 'group-1', 'actor-1');

            expect(mockOrgService.checkPermission).toHaveBeenCalledWith('org-1', 'actor-1', [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN, OrgRole.GROUP_MEMBERSHIP_ADMIN]);
            expect(mockPrismaService.group.delete).toHaveBeenCalled();
        });
    });

    describe('member operations', () => {
        it('should allow GROUP_MEMBERSHIP_ADMIN to add members', async () => {
            mockOrgService.checkPermission.mockResolvedValue({} as any);
            mockPrismaService.group.findFirst.mockResolvedValue({ id: 'group-1' } as any);
            mockPrismaService.organizationMember.findMany.mockResolvedValue([{ userId: 'user-1' }] as any);
            mockPrismaService.groupMember.findMany.mockResolvedValue([]);

            await service.addMembers('org-1', 'group-1', ['user-1'], 'actor-1');

            expect(mockOrgService.checkPermission).toHaveBeenCalledWith('org-1', 'actor-1', expect.arrayContaining([OrgRole.GROUP_MEMBERSHIP_ADMIN]));
            expect(mockPrismaService.groupMember.createMany).toHaveBeenCalled();
        });
    });
});
