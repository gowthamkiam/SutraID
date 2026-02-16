import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

import { OrganizationService } from '../organization.service';
import { OrgRole } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private orgService: OrganizationService,
  ) { }

  /**
   * List groups in an organization with pagination
   */
  async list(
    orgId: string,
    options: { search?: string; page?: number; limit?: number },
    actorId: string,
  ) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.USER_ADMIN,
      OrgRole.GROUP_MEMBERSHIP_ADMIN,
      OrgRole.READ_ONLY_ADMIN,
    ]);
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { organizationId: orgId };

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { members: true } },
        },
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        memberCount: g._count.members,
        createdAt: g.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a new group
   */
  async create(orgId: string, dto: CreateGroupDto, actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.GROUP_MEMBERSHIP_ADMIN,
    ]);
    // Check name uniqueness within org
    const existing = await this.prisma.group.findUnique({
      where: {
        organizationId_name: {
          organizationId: orgId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('A group with this name already exists');
    }

    const group = await this.prisma.group.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        description: dto.description,
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      memberCount: group._count.members,
      createdAt: group.createdAt,
    };
  }

  /**
   * Get a group with its members
   */
  async get(orgId: string, groupId: string, actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.USER_ADMIN,
      OrgRole.GROUP_MEMBERSHIP_ADMIN,
      OrgRole.READ_ONLY_ADMIN,
    ]);
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId: orgId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      memberCount: group._count.members,
      createdAt: group.createdAt,
      members: group.members.map((m) => ({
        id: m.user.id,
        email: m.user.email,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        status: m.user.status,
      })),
    };
  }

  /**
   * Update a group
   */
  async update(orgId: string, groupId: string, dto: UpdateGroupDto, actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.GROUP_MEMBERSHIP_ADMIN,
    ]);
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId: orgId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check name uniqueness if changing name
    if (dto.name && dto.name !== group.name) {
      const existing = await this.prisma.group.findUnique({
        where: {
          organizationId_name: {
            organizationId: orgId,
            name: dto.name,
          },
        },
      });
      if (existing) {
        throw new ConflictException('A group with this name already exists');
      }
    }

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: dto,
      include: {
        _count: { select: { members: true } },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      memberCount: updated._count.members,
      createdAt: updated.createdAt,
    };
  }

  /**
   * Delete a group
   */
  async remove(orgId: string, groupId: string, actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.GROUP_MEMBERSHIP_ADMIN,
    ]);
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId: orgId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.prisma.group.delete({
      where: { id: groupId },
    });

    return { success: true };
  }

  /**
   * Add members to a group (bulk)
   */
  async addMembers(orgId: string, groupId: string, userIds: string[], actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.GROUP_MEMBERSHIP_ADMIN,
    ]);
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId: orgId },
    });
    if (!group) throw new NotFoundException('Group not found');

    // Only add users who are members of the org
    const orgMembers = await this.prisma.organizationMember.findMany({
      where: {
        organizationId: orgId,
        userId: { in: userIds },
        status: 'ACTIVE',
      },
    });

    const validUserIds = orgMembers.map((m) => m.userId);

    // Skip users already in the group
    const existing = await this.prisma.groupMember.findMany({
      where: { groupId, userId: { in: validUserIds } },
    });
    const existingUserIds = new Set(existing.map((e) => e.userId));
    const newUserIds = validUserIds.filter((id) => !existingUserIds.has(id));

    if (newUserIds.length > 0) {
      await this.prisma.groupMember.createMany({
        data: newUserIds.map((userId) => ({ groupId, userId })),
      });
    }

    return { added: newUserIds.length };
  }

  /**
   * Remove a member from a group
   */
  async removeMember(orgId: string, groupId: string, userId: string, actorId: string) {
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
