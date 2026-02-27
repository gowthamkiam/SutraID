import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async list(
    options: { search?: string; page?: number; limit?: number },
  ) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const prismaAny = this.prisma as any;

    const [groups, total] = await Promise.all([
      prismaAny.group.findMany({
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
          applicationAssignments: {
            where: {
              application: { status: { not: 'ARCHIVED' } },
            },
            include: {
              application: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      prismaAny.group.count({ where }),
    ]);

    return {
      groups: groups.map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        createdAt: group.createdAt,
        memberCount: group._count.members,
        members: group.members.map((entry: any) => ({ ...entry.user, role: 'READ_ONLY_ADMIN' })),
        applications: group.applicationAssignments.map((entry: any) => entry.application),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(dto: CreateGroupDto) {
    const existing = await this.prisma.group.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Group name already exists');
    }

    const group = await this.prisma.group.create({
      data: {
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

  async update(groupId: string, dto: UpdateGroupDto) {
    const group = await this.prisma.group.findFirst({ where: { id: groupId } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (dto.name && dto.name !== group.name) {
      const existing = await this.prisma.group.findFirst({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Group name already exists');
      }
    }

    return this.prisma.group.update({
      where: { id: groupId },
      data: { name: dto.name, description: dto.description },
    });
  }

  async remove(groupId: string) {
    const group = await this.prisma.group.findFirst({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.prisma.group.delete({ where: { id: groupId } });
    return { success: true };
  }

  async setUsers(groupId: string, userIds: string[]) {
    const group = await this.prisma.group.findFirst({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const uniqueUserIds = Array.from(new Set(userIds));

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: uniqueUserIds },
      },
      select: { id: true },
    });

    const validUserIds = users.map((user) => user.id);

    await this.prisma.groupMember.deleteMany({ where: { groupId } });

    if (validUserIds.length > 0) {
      await this.prisma.groupMember.createMany({
        data: validUserIds.map((userId) => ({ userId, groupId })),
        skipDuplicates: true,
      });
    }

    return { success: true, userIds: validUserIds };
  }

  async setApplications(groupId: string, applicationIds: string[]) {
    const prismaAny = this.prisma as any;
    const group = await this.prisma.group.findFirst({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const uniqueApplicationIds = Array.from(new Set(applicationIds));
    const validApps = await this.prisma.application.findMany({
      where: {
        id: { in: uniqueApplicationIds },
        status: { not: 'ARCHIVED' },
      },
      select: { id: true },
    });
    const validAppIds = validApps.map((app) => app.id);

    await prismaAny.groupApplicationAssignment.deleteMany({
      where: { groupId },
    });

    if (validAppIds.length > 0) {
      await prismaAny.groupApplicationAssignment.createMany({
        data: validAppIds.map((applicationId) => ({ groupId, applicationId })),
        skipDuplicates: true,
      });
    }

    return { success: true, applicationIds: validAppIds };
  }

  async addMembers(groupId: string, userIds: string[]) {
    const group = await this.prisma.group.findFirst({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
    });
    const validUserIds = users.map((user) => user.id);

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

  async removeMember(groupId: string, userId: string) {
    const group = await this.prisma.group.findFirst({ where: { id: groupId } });
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
