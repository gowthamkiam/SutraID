import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrgRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../../auth/services/auth.service';
import * as bcrypt from 'bcrypt';
import { UserOnboardingMethod } from './dto/create-user.dto';

const ROLE_WEIGHT: Record<OrgRole, number> = {
  SUPER_ADMIN: 100,
  ORG_ADMIN: 90,
  APP_ADMIN: 70,
  GROUP_MEMBERSHIP_ADMIN: 70,
  USER_ADMIN: 70,
  API_ACCESS_MANAGEMENT_ADMIN: 60,
  REPORT_ADMIN: 50,
  HELP_DESK_ADMIN: 40,
  MOBILE_ADMIN: 40,
  READ_ONLY_ADMIN: 10,
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async list(
    options: {
      search?: string;
      role?: OrgRole;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.role) where.role = options.role;

    if (options.status) {
      where.status = options.status as UserStatus;
    }

    if (options.search) {
      where.OR = [
        { email: { contains: options.search, mode: 'insensitive' } },
        { firstName: { contains: options.search, mode: 'insensitive' } },
        { lastName: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          role: true,
          lastLoginAt: true,
          createdAt: true,
          mustChangePassword: true,
          groups: {
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
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
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        mustChangePassword: user.mustChangePassword,
        groups: user.groups.map((entry: any) => entry.group),
        applications: user.applicationAssignments.map((entry: any) => entry.application),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(dto: CreateUserDto, actorId: string) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    const actorRole = actor?.role || OrgRole.SUPER_ADMIN;
    const targetRole = dto.role || OrgRole.READ_ONLY_ADMIN;
    this.assertRoleHierarchy(actorRole, targetRole);

    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    const onboardingMethod = dto.onboardingMethod || UserOnboardingMethod.MAGIC_LINK;

    if (user) {
      throw new ConflictException('User already exists');
    }

    user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: targetRole,
        status: 'ACTIVE',
        mustChangePassword: onboardingMethod === UserOnboardingMethod.TEMP_PASSWORD,
      } as any,
    });

    if (dto.groupIds?.length) {
      await this.assignGroups(user.id, dto.groupIds);
    }

    if (dto.applicationIds?.length) {
      await this.assignApplications(user.id, dto.applicationIds);
    }

    if (onboardingMethod === UserOnboardingMethod.TEMP_PASSWORD) {
      if (!dto.temporaryPassword || dto.temporaryPassword.length < 8) {
        throw new BadRequestException('temporaryPassword is required and must be at least 8 characters');
      }

      const passwordHash = await bcrypt.hash(dto.temporaryPassword, 12);
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
          mustChangePassword: true,
        } as any,
      });
    } else {
      await this.authService.requestMagicLink(user.email);
    }

    return this.getOne(user.id);
  }

  async update(
    userId: string,
    dto: UpdateUserDto,
    actorId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    const actorRole = actor?.role || OrgRole.SUPER_ADMIN;

    if (dto.role) {
      this.assertRoleHierarchy(actorRole, dto.role);
      if (user.role === OrgRole.SUPER_ADMIN && actorRole !== OrgRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only SUPER_ADMIN can modify another SUPER_ADMIN');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: dto.status,
        role: dto.role,
      },
    });

    if (dto.groupIds) {
      await this.assignGroups(userId, dto.groupIds);
    }

    if (dto.applicationIds) {
      await this.assignApplications(userId, dto.applicationIds);
    }

    return this.getOne(userId);
  }

  async remove(userId: string, actorId: string) {
    if (userId === actorId) {
      throw new ForbiddenException('Cannot remove yourself');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    const actorRole = actor?.role || OrgRole.SUPER_ADMIN;

    if (user.role === OrgRole.SUPER_ADMIN && actorRole !== OrgRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can remove another SUPER_ADMIN');
    }

    await this.prisma.groupMember.deleteMany({
      where: { userId },
    });

    await this.prisma.user.delete({ where: { id: userId } });

    return { success: true };
  }

  async assignGroups(userId: string, groupIds: string[]) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uniqueIds = Array.from(new Set(groupIds));

    const validGroups = await this.prisma.group.findMany({
      where: {
        id: { in: uniqueIds },
      },
      select: { id: true },
    });

    const validGroupIds = validGroups.map((group) => group.id);

    await this.prisma.groupMember.deleteMany({
      where: { userId },
    });

    if (validGroupIds.length > 0) {
      await this.prisma.groupMember.createMany({
        data: validGroupIds.map((groupId) => ({ userId, groupId })),
        skipDuplicates: true,
      });
    }

    return { success: true, groupIds: validGroupIds };
  }

  async assignApplications(userId: string, applicationIds: string[]) {
    const prismaAny = this.prisma as any;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uniqueIds = Array.from(new Set(applicationIds));
    const validApps = await this.prisma.application.findMany({
      where: {
        id: { in: uniqueIds },
        status: { not: 'ARCHIVED' },
      },
      select: { id: true },
    });

    const validApplicationIds = validApps.map((app) => app.id);

    await prismaAny.userApplicationAssignment.deleteMany({
      where: { userId },
    });

    if (validApplicationIds.length > 0) {
      await prismaAny.userApplicationAssignment.createMany({
        data: validApplicationIds.map((applicationId) => ({ userId, applicationId })),
        skipDuplicates: true,
      });
    }

    return { success: true, applicationIds: validApplicationIds };
  }

  async assignGroup(userId: string, groupId: string, actorId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!existing) {
      await this.prisma.groupMember.create({
        data: { groupId, userId },
      });
    }

    return { success: true };
  }

  async removeGroup(userId: string, groupId: string, actorId: string) {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!existing) {
      throw new NotFoundException('User is not in this group');
    }

    await this.prisma.groupMember.delete({
      where: { id: existing.id },
    });

    return { success: true };
  }

  private async getOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        mustChangePassword: true,
        groups: {
          include: { group: { select: { id: true, name: true } } },
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
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      mustChangePassword: user.mustChangePassword,
      groups: (user.groups as any[]).map((entry: any) => entry.group),
      applications: (user.applicationAssignments as any[]).map((entry: any) => entry.application),
    };
  }

  private assertRoleHierarchy(actorRole: OrgRole, targetRole: OrgRole) {
    if (actorRole === OrgRole.SUPER_ADMIN) return;

    if (ROLE_WEIGHT[actorRole] <= ROLE_WEIGHT[targetRole]) {
      throw new ForbiddenException('Cannot assign role equal or higher than your own');
    }
  }
}
