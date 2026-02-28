import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/services/auth.service';
import { OrgRole, UserStatus } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
    let service: UsersService;
    let prismaService: jest.Mocked<PrismaService>;
    let authService: jest.Mocked<AuthService>;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        group: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
        },
        groupMember: {
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        },
        application: {
            findMany: jest.fn(),
        },
        userApplicationAssignment: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        },
    };

    const mockAuthService = {
        requestMagicLink: jest.fn(),
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
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prismaService = module.get(PrismaService);
        authService = module.get(AuthService);
        mockAuthService.requestMagicLink.mockResolvedValue({ message: 'Magic link sent' });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('list', () => {
        it('should return users', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([]);
            mockPrismaService.user.count.mockResolvedValue(0);

            const result = await service.list({});

            expect(result.users).toEqual([]);
            expect(mockPrismaService.user.findMany).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('should create user', async () => {
            const dto = { email: 'new@test.com', firstName: 'John', lastName: 'Doe', role: OrgRole.READ_ONLY_ADMIN };
            mockPrismaService.user.findUnique.mockResolvedValue(null);
            mockPrismaService.user.create.mockResolvedValue({ id: 'user-1', ...dto } as any);
            // Mock actor for hierarchy check
            mockPrismaService.user.findUnique.mockImplementation(({ where }: any) => {
                if (where.email === 'new@test.com') return Promise.resolve(null);
                if (where.id === 'actor-1') return Promise.resolve({ id: 'actor-1', role: OrgRole.SUPER_ADMIN } as any);
                if (where.id === 'user-1') return Promise.resolve({ id: 'user-1', ...dto, groups: [], applicationAssignments: [] } as any);
                return Promise.resolve(null);
            });

            const result = await service.create(dto as any, 'actor-1');

            expect(result.id).toBe('user-1');
            expect(mockPrismaService.user.create).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update user', async () => {
            const dto = { firstName: 'Updated' };
            mockPrismaService.user.findUnique.mockImplementation(({ where }: any) => {
                if (where.id === 'user-1') return Promise.resolve({ id: 'user-1', firstName: 'Old', role: OrgRole.READ_ONLY_ADMIN, groups: [], applicationAssignments: [] } as any);
                if (where.id === 'actor-1') return Promise.resolve({ id: 'actor-1', role: OrgRole.SUPER_ADMIN } as any);
                return Promise.resolve(null);
            });

            await service.update('user-1', dto, 'actor-1');

            expect(mockPrismaService.user.update).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should remove user', async () => {
            mockPrismaService.user.findUnique.mockImplementation(({ where }: any) => {
                if (where.id === 'user-1') return Promise.resolve({ id: 'user-1', role: OrgRole.READ_ONLY_ADMIN } as any);
                if (where.id === 'actor-1') return Promise.resolve({ id: 'actor-1', role: OrgRole.SUPER_ADMIN } as any);
                return Promise.resolve(null);
            });

            await service.remove('user-1', 'actor-1');

            expect(mockPrismaService.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
        });

        it('should not allow removing self', async () => {
            await expect(service.remove('actor-1', 'actor-1')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('group operations', () => {
        it('should assign group', async () => {
            mockPrismaService.group.findFirst.mockResolvedValue({ id: 'group-1' } as any);
            mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1' } as any);
            mockPrismaService.groupMember.findUnique.mockResolvedValue(null);

            await service.assignGroup('user-1', 'group-1', 'actor-1');

            expect(mockPrismaService.groupMember.create).toHaveBeenCalled();
        });

        it('should remove group', async () => {
            mockPrismaService.group.findFirst.mockResolvedValue({ id: 'group-1' } as any);
            mockPrismaService.groupMember.findUnique.mockResolvedValue({ id: 'gm-1' } as any);

            await service.removeGroup('user-1', 'group-1', 'actor-1');

            expect(mockPrismaService.groupMember.delete).toHaveBeenCalled();
        });
    });
});
