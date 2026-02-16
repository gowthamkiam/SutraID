import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { OrganizationService } from '../organization.service';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
    private orgService: OrganizationService,
  ) {}

  async list(
    orgId: string,
    options: { search?: string; page?: number; limit?: number },
    actorId?: string,
  ) {
    if (actorId) {
      await this.orgService.checkPermission(orgId, actorId, [
        OrgRole.SUPER_ADMIN,
        OrgRole.ORG_ADMIN,
        OrgRole.USER_ADMIN,
        OrgRole.GROUP_MEMBERSHIP_ADMIN,
        OrgRole.READ_ONLY_ADMIN,
      ]);
    }
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
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        createdAt: group.createdAt,
        memberCount: group._count.members,
        members: group.members.map((entry) => ({ ...entry.user, role: 'READ_ONLY_ADMIN' })),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(orgId: string, dto: CreateGroupDto, actorId?: string) {
    if (actorId) {
      await this.orgService.checkPermission(orgId, actorId, [
        OrgRole.SUPER_ADMIN,
        OrgRole.ORG_ADMIN,
        OrgRole.GROUP_MEMBERSHIP_ADMIN,
      ]);
    }
    const existing = await this.prisma.group.findUnique({
      where: {
        organizationId_name: {
          organizationId: orgId,
          name: dto.name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Group name already exists in this organization');
    }

    const group = await this.prisma.group.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        description: dto.description,
      },
    });

    return {
      ...group,
      memberCount: 0,
      members: [],
    };
  }

  async update(orgId: string, groupId: string, dto: UpdateGroupDto, actorId?: string) {
    if (actorId) {
      await this.orgService.checkPermission(orgId, actorId, [
        OrgRole.SUPER_ADMIN,
        OrgRole.ORG_ADMIN,
        OrgRole.GROUP_MEMBERSHIP_ADMIN,
      ]);
    }
    const group = await this.prisma.group.findFirst({ where: { id: groupId, organizationId: orgId } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

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
        throw new ConflictException('Group name already exists in this organization');
      }
    }

    return this.prisma.group.update({
      where: { id: groupId },
      data: { name: dto.name, description: dto.description },
    });
  }

  async remove(orgId: string, groupId: string, actorId?: string) {
    if (actorId) {
      await this.orgService.checkPermission(orgId, actorId, [
        OrgRole.SUPER_ADMIN,
        OrgRole.ORG_ADMIN,
        OrgRole.GROUP_MEMBERSHIP_ADMIN,
      ]);
    }
    const group = await this.prisma.group.findFirst({ where: { id: groupId, organizationId: orgId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.prisma.group.delete({ where: { id: groupId } });
    return { success: true };
  }

  async setUsers(orgId: string, groupId: string, userIds: string[]) {
    const group = await this.prisma.group.findFirst({ where: { id: groupId, organizationId: orgId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const uniqueUserIds = Array.from(new Set(userIds));

    const members = await this.prisma.organizationMember.findMany({
      where: {
        organizationId: orgId,
        userId: { in: uniqueUserIds },
        status: 'ACTIVE',
      },
      select: { userId: true },
    });

    const validUserIds = members.map((member) => member.userId);

    await this.prisma.groupMember.deleteMany({ where: { groupId } });

    if (validUserIds.length > 0) {
      await this.prisma.groupMember.createMany({
        data: validUserIds.map((userId) => ({ userId, groupId })),
        skipDuplicates: true,
      });
    }

    return { success: true, userIds: validUserIds };
  }

  async addMembers(orgId: string, groupId: string, userIds: string[], actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.GROUP_MEMBERSHIP_ADMIN,
    ]);

    const group = await this.prisma.group.findFirst({ where: { id: groupId, organizationId: orgId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const orgMembers = await this.prisma.organizationMember.findMany({
      where: {
        organizationId: orgId,
        userId: { in: userIds },
        status: 'ACTIVE',
      },
    });
    const validUserIds = orgMembers.map((member: any) => member.userId);

    const existing = await this.prisma.groupMember.findMany({
      where: { groupId, userId: { in: validUserIds } },
    });
    const existingUserIds = new Set((existing as any[]).map((entry) => entry.userId));
    const newUserIds = validUserIds.filter((id) => !existingUserIds.has(id));

    if (newUserIds.length > 0) {
      await this.prisma.groupMember.createMany({
        data: newUserIds.map((userId) => ({ groupId, userId })),
      });
    }

    return { added: newUserIds.length };
  }

  async removeMember(orgId: string, groupId: string, userId: string, actorId: string) {
    await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.GROUP_MEMBERSHIP_ADMIN,
    ]);

    const group = await this.prisma.group.findFirst({ where: { id: groupId, organizationId: orgId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!membership) {
      throw new NotFoundException('User is not in this group');
    }

    await this.prisma.groupMember.delete({
      where: { id: (membership as any).id },
    });

    return { success: true };
  }
}
