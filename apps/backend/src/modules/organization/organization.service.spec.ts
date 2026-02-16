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
        members: [{ role: OrgRole.SUPER_ADMIN }],
      } as any);

      const result = await service.create('user-1', dto);

      expect(result.id).toBe('org-1');
      expect(mockPrismaService.organization.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          members: {
            create: {
              userId: 'user-1',
              role: OrgRole.SUPER_ADMIN,
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
  });

  describe('findUserOrganizations', () => {
    it('should return user organizations with role', async () => {
      const mockMemberships = [
        {
          role: OrgRole.SUPER_ADMIN,
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
        role: OrgRole.SUPER_ADMIN,
        memberCount: 5,
        applicationCount: 3,
      });
    });
  });

  describe('findOne', () => {
    it('should return organization if member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.READ_ONLY_ADMIN,
        organization: { id: 'org-1', name: 'Org 1' },
      } as any);

      const result = await service.findOne('org-1', 'user-1');

      expect(result.id).toBe('org-1');
      expect(result.userRole).toBe(OrgRole.READ_ONLY_ADMIN);
    });

    it('should throw NotFoundException if not member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(null);

      await expect(service.findOne('org-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should allow SUPER_ADMIN to update', async () => {
      const dto = { name: 'Updated Name' };
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.SUPER_ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);
      mockPrismaService.organization.update.mockResolvedValue({ id: 'org-1', ...dto } as any);

      const result = await service.update('org-1', 'user-1', dto);
      expect(result.name).toBe('Updated Name');
    });

    it('should allow ORG_ADMIN to update', async () => {
      const dto = { name: 'Updated Name' };
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.ORG_ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);
      mockPrismaService.organization.update.mockResolvedValue({ id: 'org-1', ...dto } as any);

      const result = await service.update('org-1', 'user-1', dto);
      expect(result.name).toBe('Updated Name');
    });

    it('should throw ForbiddenException for other roles', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.READ_ONLY_ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      await expect(service.update('org-1', 'user-1', { name: 'New' })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should allow SUPER_ADMIN to delete', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.SUPER_ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);
      mockPrismaService.organization.update.mockResolvedValue({ id: 'org-1', status: 'DELETED' } as any);

      const result = await service.remove('org-1', 'user-1');
      expect(result.status).toBe('DELETED');
    });

    it('should throw ForbiddenException for ORG_ADMIN', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.ORG_ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      await expect(service.remove('org-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('checkPermission', () => {
    it('should pass if user has required role', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.ORG_ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      const result = await service.checkPermission('org-1', 'user-1', [
        OrgRole.ORG_ADMIN,
      ]);

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException if sufficient permissions', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.READ_ONLY_ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      await expect(
        service.checkPermission('org-1', 'user-1', [OrgRole.ORG_ADMIN]),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('inviteMember', () => {
    it('should invite new member successfully', async () => {
      const dto = {
        email: 'newuser@example.com',
        role: OrgRole.READ_ONLY_ADMIN,
      };

      mockPrismaService.organizationMember.findUnique
        .mockResolvedValueOnce({
          role: OrgRole.ORG_ADMIN,
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
    });

    it('should require SUPER_ADMIN role to invite SUPER_ADMIN', async () => {
      const dto = {
        email: 'newowner@example.com',
        role: OrgRole.SUPER_ADMIN,
      };

      mockPrismaService.organizationMember.findUnique
        .mockResolvedValueOnce({
          role: OrgRole.ORG_ADMIN,
          status: MemberStatus.ACTIVE,
        } as any)
        .mockResolvedValueOnce({
          role: OrgRole.ORG_ADMIN,
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

    it('should throw ForbiddenException if HELP_DESK_ADMIN tries to invite', async () => {
      const dto = {
        email: 'newuser@example.com',
        role: OrgRole.READ_ONLY_ADMIN,
      };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.HELP_DESK_ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      await expect(
        service.inviteMember('org-1', 'helpdesk-user', dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role successfully by SUPER_ADMIN', async () => {
      const dto = { role: OrgRole.ORG_ADMIN };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.SUPER_ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      mockPrismaService.organizationMember.update.mockResolvedValue({
        id: 'member-1',
        role: OrgRole.ORG_ADMIN,
      } as any);

      const result = await service.updateMemberRole(
        'org-1',
        'member-1',
        'super-user',
        dto,
      );

      expect(result.role).toBe(OrgRole.ORG_ADMIN);
    });

    it('should only allow SUPER_ADMIN to promote to SUPER_ADMIN', async () => {
      const dto = { role: OrgRole.SUPER_ADMIN };

      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.ORG_ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      await expect(
        service.updateMemberRole('org-1', 'member-1', 'admin-user', dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully by ORG_ADMIN', async () => {
      mockPrismaService.organizationMember.findUnique
        .mockResolvedValueOnce({
          role: OrgRole.ORG_ADMIN,
          status: MemberStatus.ACTIVE,
        } as any)
        .mockResolvedValueOnce({
          id: 'target-member',
          organizationId: 'org-1',
          role: OrgRole.READ_ONLY_ADMIN,
        } as any);

      mockPrismaService.organizationMember.delete.mockResolvedValue({} as any);

      await service.removeMember('org-1', 'target-member', 'admin-user');

      expect(mockPrismaService.organizationMember.delete).toHaveBeenCalledWith({
        where: { id: 'target-member' },
      });
    });

    it('should only allow SUPER_ADMIN to remove SUPER_ADMIN', async () => {
      mockPrismaService.organizationMember.findUnique
        .mockResolvedValueOnce({
          role: OrgRole.ORG_ADMIN,
          status: MemberStatus.ACTIVE,
        } as any)
        .mockResolvedValueOnce({
          id: 'owner-member',
          organizationId: 'org-1',
          role: OrgRole.SUPER_ADMIN,
        } as any);

      await expect(
        service.removeMember('org-1', 'owner-member', 'admin-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserRole', () => {
    it('should return user role if active member', async () => {
      mockPrismaService.organizationMember.findUnique.mockResolvedValue({
        role: OrgRole.ORG_ADMIN,
        status: MemberStatus.ACTIVE,
      } as any);

      const role = await service.getUserRole('org-1', 'user-1');

      expect(role).toBe(OrgRole.ORG_ADMIN);
    });
  });
});
