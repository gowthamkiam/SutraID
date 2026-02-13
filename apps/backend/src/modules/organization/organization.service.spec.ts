import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { OrgRole, MemberStatus } from '@prisma/client';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    organizationMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create organization with owner', async () => {
      const dto = {
        name: 'Test Org',
        slug: 'test-org',
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(null);
      mockPrismaService.organization.create.mockResolvedValue({
        id: 'org-1',
        ...dto,
        members: [{ role: OrgRole.OWNER }],
      } as any);

      const result = await service.create('user-1', dto);

      expect(result.id).toBe('org-1');
      expect(mockPrismaService.organization.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          members: {
            create: {
              userId: 'user-1',
              role: OrgRole.OWNER,
              status: MemberStatus.ACTIVE,
              joinedAt: expect.any(Date),
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });
    });

    it('should throw ConflictException if slug is taken', async () => {
      const dto = {
        name: 'Test Org',
        slug: 'existing-slug',
      };

      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: 'existing-org',
      } as any);

      await expect(service.create('user-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if domain is taken', async () => {
      const dto = {
        name: 'Test Org',
        slug: 'test-org',
        domain: 'existing.com',
      };

      mockPrismaService.organization.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing-org' } as any);

      await expect(service.create('user-1', dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findUserOrganizations', () => {
    it('should return user organizations with role', async () => {
      const mockMemberships = [
        {
          role: OrgRole.OWNER,
          organization: {
            id: 'org-1',
            name: 'Org 1',
            _count: { members: 5, applications: 3 },
          },
        },
      ];

      mockPrismaService.organizationMember.findMany.mockResolvedValue(
        mockMemberships as any,
      );

      const result = await service.findUserOrganizations('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'org-1',
        name: 'Org 1',
        role: OrgRole.OWNER,
        memberCount: 5,
        applicationCount: 3,
      });
    });
  });

  describe('checkPermission', () => {
    it('should pass if user has required role', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      const result = await service.checkPermission('org-1', 'user-1', [
        OrgRole.ADMIN,
      ]);

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if user not member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.checkPermission('org-1', 'user-1', [OrgRole.ADMIN]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if member not active', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.ADMIN,
        status: MemberStatus.PENDING_INVITATION,
      } as any);

      await expect(
        service.checkPermission('org-1', 'user-1', [OrgRole.ADMIN]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if insufficient permissions', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.MEMBER,
        status: MemberStatus.ACTIVE,
      } as any);

      await expect(
        service.checkPermission('org-1', 'user-1', [OrgRole.ADMIN]),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('inviteMember', () => {
    it('should invite new member successfully', async () => {
      const dto = {
        email: 'newuser@example.com',
        role: OrgRole.MEMBER,
      };

      mockPrismaService.organizationMember.findUnique
        .mockResolvedValueOnce({
          role: OrgRole.ADMIN,
          status: MemberStatus.ACTIVE,
        } as any)
        .mockResolvedValueOnce(null);

      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        maxMembers: 100,
        _count: { members: 5 },
      } as any);

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'new-user',
        email: dto.email,
      } as any);

      mockPrismaService.organizationMember.create.mockResolvedValue({
        id: 'member-1',
        role: dto.role,
        status: MemberStatus.PENDING_INVITATION,
      } as any);

      const result = await service.inviteMember('org-1', 'admin-user', dto);

      expect(result).toBeDefined();
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if member limit reached', async () => {
      const dto = {
        email: 'newuser@example.com',
        role: OrgRole.MEMBER,
      };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        maxMembers: 10,
        _count: { members: 10 },
      } as any);

      await expect(
        service.inviteMember('org-1', 'admin-user', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already member', async () => {
      const dto = {
        email: 'existing@example.com',
        role: OrgRole.MEMBER,
      };

      mockPrismaService.organizationMember.findUnique
        .mockResolvedValueOnce({
          role: OrgRole.ADMIN,
          status: MemberStatus.ACTIVE,
        } as any)
        .mockResolvedValueOnce({ id: 'existing-membership' } as any);

      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        maxMembers: 100,
        _count: { members: 5 },
      } as any);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: dto.email,
      } as any);

      await expect(
        service.inviteMember('org-1', 'admin-user', dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should require OWNER role to invite OWNER', async () => {
      const dto = {
        email: 'newowner@example.com',
        role: OrgRole.OWNER,
      };

      mockPrismaService.organizationMember.findUnique
        .mockResolvedValueOnce({
          role: OrgRole.ADMIN,
          status: MemberStatus.ACTIVE,
        } as any)
        .mockResolvedValueOnce({
          role: OrgRole.ADMIN,
          status: MemberStatus.ACTIVE,
        } as any);

      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        maxMembers: 100,
        _count: { members: 5 },
      } as any);

      await expect(
        service.inviteMember('org-1', 'admin-user', dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role successfully', async () => {
      const dto = { role: OrgRole.ADMIN };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.OWNER,
        status: MemberStatus.ACTIVE,
      } as any);

      mockPrismaService.organizationMember.update.mockResolvedValue({
        id: 'member-1',
        role: OrgRole.ADMIN,
      } as any);

      const result = await service.updateMemberRole(
        'org-1',
        'member-1',
        'owner-user',
        dto,
      );

      expect(result.role).toBe(OrgRole.ADMIN);
    });

    it('should throw BadRequestException when changing own role', async () => {
      const dto = { role: OrgRole.ADMIN };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.OWNER,
        status: MemberStatus.ACTIVE,
      } as any);

      await expect(
        service.updateMemberRole('org-1', 'owner-user', 'owner-user', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should only allow OWNER to promote to OWNER', async () => {
      const dto = { role: OrgRole.OWNER };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      await expect(
        service.updateMemberRole('org-1', 'member-1', 'admin-user', dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      mockPrismaService.organizationMember.findUnique
        .mockResolvedValueOnce({
          role: OrgRole.ADMIN,
          status: MemberStatus.ACTIVE,
        } as any)
        .mockResolvedValueOnce({
          id: 'target-member',
          organizationId: 'org-1',
          role: OrgRole.MEMBER,
        } as any);

      mockPrismaService.organizationMember.delete.mockResolvedValue({} as any);

      await service.removeMember('org-1', 'target-member', 'admin-user');

      expect(mockPrismaService.organizationMember.delete).toHaveBeenCalledWith({
        where: { id: 'target-member' },
      });
    });

    it('should throw BadRequestException when removing self', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      await expect(
        service.removeMember('org-1', 'admin-user', 'admin-user'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should only allow OWNER to remove OWNER', async () => {
      mockPrismaService.organizationMember.findUnique
        .mockResolvedValueOnce({
          role: OrgRole.ADMIN,
          status: MemberStatus.ACTIVE,
        } as any)
        .mockResolvedValueOnce({
          id: 'owner-member',
          organizationId: 'org-1',
          role: OrgRole.OWNER,
        } as any);

      await expect(
        service.removeMember('org-1', 'owner-member', 'admin-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserRole', () => {
    it('should return user role if active member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      const role = await service.getUserRole('org-1', 'user-1');

      expect(role).toBe(OrgRole.ADMIN);
    });

    it('should return null if not active member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.ADMIN,
        status: MemberStatus.PENDING_INVITATION,
      } as any);

      const role = await service.getUserRole('org-1', 'user-1');

      expect(role).toBeNull();
    });

    it('should return null if not member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      const role = await service.getUserRole('org-1', 'user-1');

      expect(role).toBeNull();
    });
  });
});
