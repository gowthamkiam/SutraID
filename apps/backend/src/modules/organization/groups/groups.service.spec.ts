import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('GroupsService', () => {
    let service: GroupsService;
    let prismaService: jest.Mocked<PrismaService>;

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
        user: {
            findMany: jest.fn(),
        },
        groupMember: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            createMany: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GroupsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<GroupsService>(GroupsService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('list', () => {
        it('should return groups', async () => {
            mockPrismaService.group.findMany.mockResolvedValue([]);
            mockPrismaService.group.count.mockResolvedValue(0);

            const result = await service.list({});

            expect(result.groups).toEqual([]);
            expect(mockPrismaService.group.findMany).toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('should create group', async () => {
            const dto = { name: 'New Group', description: 'Desc' };
            mockPrismaService.group.findFirst.mockResolvedValue(null);
            mockPrismaService.group.create.mockResolvedValue({ id: 'group-1', ...dto } as any);

            const result = await service.create(dto);

            expect(result.id).toBe('group-1');
            expect(mockPrismaService.group.create).toHaveBeenCalled();
        });

        it('should throw ConflictException if group exists', async () => {
            const dto = { name: 'Existing' };
            mockPrismaService.group.findFirst.mockResolvedValue({ id: '1' } as any);

            await expect(service.create(dto)).rejects.toThrow(ConflictException);
        });
    });

    describe('update', () => {
        it('should update group', async () => {
            const dto = { name: 'Updated' };
            // First call to find the group
            mockPrismaService.group.findFirst.mockResolvedValueOnce({ id: 'group-1', name: 'Old' } as any);
            // Second call to check if 'Updated' exists
            mockPrismaService.group.findFirst.mockResolvedValueOnce(null);
            mockPrismaService.group.update.mockResolvedValue({ id: 'group-1', name: 'Updated' } as any);

            await service.update('group-1', dto);

            expect(mockPrismaService.group.update).toHaveBeenCalled();
        });

        it('should throw NotFoundException if group not found', async () => {
            mockPrismaService.group.findFirst.mockResolvedValue(null);
            await expect(service.update('non-existent', {})).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should remove group', async () => {
            mockPrismaService.group.findFirst.mockResolvedValue({ id: 'group-1' } as any);

            await service.remove('group-1');

            expect(mockPrismaService.group.delete).toHaveBeenCalledWith({ where: { id: 'group-1' } });
        });
    });

    describe('member operations', () => {
        it('should add members', async () => {
            mockPrismaService.group.findFirst.mockResolvedValue({ id: 'group-1' } as any);
            mockPrismaService.user.findMany.mockResolvedValue([{ id: 'user-1' }] as any);
            mockPrismaService.groupMember.findMany.mockResolvedValue([]);

            const result = await service.addMembers('group-1', ['user-1']);

            expect(result.added).toBe(1);
            expect(mockPrismaService.groupMember.createMany).toHaveBeenCalled();
        });
    });
});
