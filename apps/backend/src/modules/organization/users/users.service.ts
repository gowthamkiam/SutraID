import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgRole, MemberStatus } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { OrganizationService } from '../organization.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private orgService: OrganizationService,
  ) { }

  /**
   * List users in an organization with search, filter, pagination
   */
  async list(
    orgId: string,
    options: {
      search?: string;
      role?: OrgRole;
      status?: string;
      page?: number;
      limit?: number;
    },
    actorId: string,
  ) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.USER_ADMIN,
      OrgRole.HELP_DESK_ADMIN,
      OrgRole.READ_ONLY_ADMIN,
      OrgRole.REPORT_ADMIN,
    ]);
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: orgId,
      status: MemberStatus.ACTIVE,
    };

    if (options.role) {
      where.role = options.role;
    }

    if (options.status) {
      where.user = { status: options.status };
    }

    if (options.search) {
      where.user = {
        ...where.user,
        OR: [
          { email: { contains: options.search, mode: 'insensitive' } },
          { firstName: { contains: options.search, mode: 'insensitive' } },
          { lastName: { contains: options.search, mode: 'insensitive' } },
        ],
      };
    }

    const [members, total] = await Promise.all([
      this.prisma.organizationMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true,
              lastLoginAt: true,
              createdAt: true,
              groups: {
                include: {
                  group: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.organizationMember.count({ where }),
    ]);

    const users = members.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      status: m.user.status,
      role: m.role,
      lastLoginAt: m.user.lastLoginAt,
      createdAt: m.user.createdAt,
      groups: m.user.groups.map((g) => ({
        id: g.group.id,
        name: g.group.name,
      })),
    }));

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new user in the organization
   */
  async create(orgId: string, dto: CreateUserDto, actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.USER_ADMIN,
    ]);
    // Check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      // Check if already a member
      const existing = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: user.id,
          },
        },
      });
      if (existing) {
        throw new ConflictException('User is already a member of this organization');
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          emailVerified: false,
          status: 'ACTIVE',
        },
      });
    }

    // Create membership
    await this.prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: dto.role || OrgRole.READ_ONLY_ADMIN,
        status: MemberStatus.ACTIVE,
        joinedAt: new Date(),
      },
    });

    return this.get(orgId, user.id, actorId);
  }

  /**
   * Get a single user in the organization
   */
  async get(orgId: string, userId: string, actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.USER_ADMIN,
      OrgRole.HELP_DESK_ADMIN,
      OrgRole.READ_ONLY_ADMIN,
      OrgRole.REPORT_ADMIN,
    ]);
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
            groups: {
              where: {
                group: { organizationId: orgId },
              },
              include: {
                group: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('User not found in this organization');
    }

    return {
      id: member.user.id,
      email: member.user.email,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      status: member.user.status,
      role: member.role,
      lastLoginAt: member.user.lastLoginAt,
      createdAt: member.user.createdAt,
      groups: member.user.groups.map((g) => ({
        id: g.group.id,
        name: g.group.name,
      })),
    };
  }

  /**
   * Update a user's profile or role
   */
  async update(orgId: string, userId: string, dto: UpdateUserDto, actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.USER_ADMIN,
      OrgRole.HELP_DESK_ADMIN,
    ]);
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('User not found in this organization');
    }

    // Update user profile if name fields provided
    if (dto.firstName !== undefined || dto.lastName !== undefined || dto.status !== undefined) {
      const userData: any = {};
      if (dto.firstName !== undefined) userData.firstName = dto.firstName;
      if (dto.lastName !== undefined) userData.lastName = dto.lastName;
      if (dto.status !== undefined) userData.status = dto.status;

      await this.prisma.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    // Update role if provided
    if (dto.role) {
      await this.prisma.organizationMember.update({
        where: { id: member.id },
        data: { role: dto.role },
      });
    }

    return this.get(orgId, userId, actorId);
  }

  /**
   * Remove user from organization
   */
  async remove(orgId: string, userId: string, actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.USER_ADMIN,
    ]);

    // SUPER_ADMIN cannot delete themselves
    if (userId === actorId) {
      throw new ForbiddenException('Cannot remove yourself from the organization');
    }

    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('User not found in this organization');
    }

    await this.prisma.organizationMember.delete({
      where: { id: member.id },
    });

    return { success: true };
  }

  /**
   * Assign user to a group
   */
  async assignGroup(orgId: string, userId: string, groupId: string, actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.GROUP_MEMBERSHIP_ADMIN,
    ]);
    // Verify group belongs to org
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId: orgId },
    });
    if (!group) throw new NotFoundException('Group not found');

    // Verify user is member of org
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId },
      },
    });
    if (!member) throw new NotFoundException('User not found in this organization');

    // Check if already in group
    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (existing) throw new ConflictException('User is already in this group');

    await this.prisma.groupMember.create({
      data: { groupId, userId },
    });

    return { success: true };
  }

  /**
   * Remove user from a group
   */
  async removeGroup(orgId: string, userId: string, groupId: string, actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.GROUP_MEMBERSHIP_ADMIN,
    ]);
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId: orgId },
    });
    if (!group) throw new NotFoundException('Group not found');

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new NotFoundException('User is not in this group');

    await this.prisma.groupMember.delete({
      where: { id: membership.id },
    });

    return { success: true };
  }
}
