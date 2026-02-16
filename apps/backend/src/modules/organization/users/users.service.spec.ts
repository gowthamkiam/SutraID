import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationService } from '../organization.service';
import { OrgRole, MemberStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
    let service: UsersService;
    let prismaService: jest.Mocked<PrismaService>;
    let orgService: jest.Mocked<OrganizationService>;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        organizationMember: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        group: {
            findFirst: jest.fn(),
        },
        groupMember: {
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
        },
    };

    const mockOrgService = {
        checkPermission: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
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

        service = module.get<UsersService>(UsersService);
        prismaService = module.get(PrismaService);
        orgService = module.get(OrganizationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('list', () => {
        it('should call checkPermission and return users', async () => {
            mockOrgService.checkPermission.mockResolvedValue({} as any);
            mockPrismaService.organizationMember.findMany.mockResolvedValue([]);
            mockPrismaService.organizationMember.count.mockResolvedValue(0);

            await service.list('org-1', {}, 'actor-1');

            expect(mockOrgService.checkPermission).toHaveBeenCalledWith('org-1', 'actor-1', expect.arrayContaining([OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN, OrgRole.USER_ADMIN]));
        });

        it('should throw ForbiddenException if checkPermission fails', async () => {
            mockOrgService.checkPermission.mockRejectedValue(new ForbiddenException());

            await expect(service.list('org-1', {}, 'actor-1')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('create', () => {
        it('should allow authorized roles to create user', async () => {
            const dto = { email: 'new@test.com', firstName: 'John', lastName: 'Doe', role: OrgRole.READ_ONLY_ADMIN };
            mockOrgService.checkPermission.mockResolvedValue({} as any);
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockPrismaService.user.create.mockResolvedValue({ id: 'user-1', ...dto } as any);
            mockPrismaService.organizationMember.findUnique.mockResolvedValue({
                id: 'member-1',
                user: { id: 'user-1', ...dto, groups: [] },
                role: OrgRole.READ_ONLY_ADMIN
            } as any);

            const result = await service.create('org-1', dto, 'actor-1');

            expect(mockOrgService.checkPermission).toHaveBeenCalledWith('org-1', 'actor-1', [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN, OrgRole.USER_ADMIN]);
            expect(result.id).toBe('user-1');
        });
    });

    describe('update', () => {
        it('should allow HELP_DESK_ADMIN to update user', async () => {
            const dto = { firstName: 'Updated' };
            mockOrgService.checkPermission.mockResolvedValue({} as any);
            mockPrismaService.organizationMember.findUnique.mockResolvedValue({
                id: 'member-1',
                organizationId: 'org-1',
                userId: 'user-1',
                user: { id: 'user-1', firstName: 'Updated', groups: [] }
            } as any);

            await service.update('org-1', 'user-1', dto, 'actor-1');

            expect(mockOrgService.checkPermission).toHaveBeenCalledWith('org-1', 'actor-1', expect.arrayContaining([OrgRole.HELP_DESK_ADMIN]));
            expect(mockPrismaService.user.update).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should allow authorized roles to remove user', async () => {
            mockOrgService.checkPermission.mockResolvedValue({} as any);
            mockPrismaService.organizationMember.findUnique.mockResolvedValue({ id: 'member-1' } as any);

            await service.remove('org-1', 'user-1', 'actor-1');

            expect(mockOrgService.checkPermission).toHaveBeenCalledWith('org-1', 'actor-1', [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN, OrgRole.USER_ADMIN]);
            expect(mockPrismaService.organizationMember.delete).toHaveBeenCalled();
        });

        it('should not allow removing self', async () => {
            mockOrgService.checkPermission.mockResolvedValue({} as any);
            await expect(service.remove('org-1', 'actor-1', 'actor-1')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('group operations', () => {
        it('should allow GROUP_MEMBERSHIP_ADMIN to assign group', async () => {
            mockOrgService.checkPermission.mockResolvedValue({} as any);
            mockPrismaService.group.findFirst.mockResolvedValue({ id: 'group-1' } as any);
            mockPrismaService.organizationMember.findUnique.mockResolvedValue({ id: 'member-1' } as any);
            mockPrismaService.groupMember.findUnique.mockResolvedValue(null);

            await service.assignGroup('org-1', 'user-1', 'group-1', 'actor-1');

            expect(mockOrgService.checkPermission).toHaveBeenCalledWith('org-1', 'actor-1', expect.arrayContaining([OrgRole.GROUP_MEMBERSHIP_ADMIN]));
            expect(mockPrismaService.groupMember.create).toHaveBeenCalled();
        });

        it('should allow GROUP_MEMBERSHIP_ADMIN to remove group', async () => {
            mockOrgService.checkPermission.mockResolvedValue({} as any);
            mockPrismaService.group.findFirst.mockResolvedValue({ id: 'group-1' } as any);
            mockPrismaService.groupMember.findUnique.mockResolvedValue({ id: 'gm-1' } as any);

            await service.removeGroup('org-1', 'user-1', 'group-1', 'actor-1');

            expect(mockOrgService.checkPermission).toHaveBeenCalledWith('org-1', 'actor-1', expect.arrayContaining([OrgRole.GROUP_MEMBERSHIP_ADMIN]));
            expect(mockPrismaService.groupMember.delete).toHaveBeenCalled();
        });
    });
});
