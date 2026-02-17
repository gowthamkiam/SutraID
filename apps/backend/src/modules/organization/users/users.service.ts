import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrgRole, MemberStatus, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { OrganizationService } from '../organization.service';
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
    private orgService: OrganizationService,
    private authService: AuthService,
  ) {}

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

    if (options.role) where.role = options.role;

    if (options.status) {
      where.user = { status: options.status as UserStatus };
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

    const prismaAny = this.prisma as any;

    const [members, total] = await Promise.all([
      prismaAny.organizationMember.findMany({
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
              mustChangePassword: true,
              groups: {
                where: {
                  group: { organizationId: orgId },
                },
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
                  application: { organizationId: orgId, status: { not: 'ARCHIVED' } },
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
          },
        },
      }),
      prismaAny.organizationMember.count({ where }),
    ]);

    return {
      users: members.map((member: any) => ({
        id: member.user.id,
        email: member.user.email,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        status: member.user.status,
        role: member.role,
        createdAt: member.user.createdAt,
        lastLoginAt: member.user.lastLoginAt,
        mustChangePassword: member.user.mustChangePassword,
        groups: member.user.groups.map((entry: any) => entry.group),
        applications: member.user.applicationAssignments.map((entry: any) => entry.application),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(orgId: string, dto: CreateUserDto, actorId: string) {
    const actorMembership = await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.USER_ADMIN,
    ]);

    const actorRole = (actorMembership as any)?.role || OrgRole.SUPER_ADMIN;
    const targetRole = dto.role || OrgRole.READ_ONLY_ADMIN;
    this.assertRoleHierarchy(actorRole, targetRole);

    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    const onboardingMethod = dto.onboardingMethod || UserOnboardingMethod.MAGIC_LINK;

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: 'ACTIVE',
          mustChangePassword: onboardingMethod === UserOnboardingMethod.TEMP_PASSWORD,
        } as any,
      });
    } else if (dto.firstName || dto.lastName) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: dto.firstName ?? user.firstName,
          lastName: dto.lastName ?? user.lastName,
        },
      });
    }

    const existingMembership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('User already exists in this organization');
    }

    await this.prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: targetRole,
        status: MemberStatus.ACTIVE,
        joinedAt: new Date(),
      },
    });

    if (dto.groupIds?.length) {
      await this.assignGroups(orgId, user.id, dto.groupIds);
    }

    if (dto.applicationIds?.length) {
      await this.assignApplications(orgId, user.id, dto.applicationIds);
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

    return this.getOne(orgId, user.id);
  }

  async update(
    orgId: string,
    userId: string,
    dto: UpdateUserDto,
    actorId: string,
  ) {
    const actorMembership = await this.orgService.checkPermission(orgId, actorId, [
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

    const actorRole = (actorMembership as any)?.role || OrgRole.SUPER_ADMIN;

    if (dto.role) {
      this.assertRoleHierarchy(actorRole, dto.role);
      if (member.role === OrgRole.SUPER_ADMIN && actorRole !== OrgRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only SUPER_ADMIN can modify another SUPER_ADMIN');
      }

      await this.prisma.organizationMember.update({
        where: { id: member.id },
        data: { role: dto.role },
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: dto.status,
      },
    });

    if (dto.groupIds) {
      await this.assignGroups(orgId, userId, dto.groupIds);
    }

    if (dto.applicationIds) {
      await this.assignApplications(orgId, userId, dto.applicationIds);
    }

    return this.getOne(orgId, userId);
  }

  async remove(orgId: string, userId: string, actorId: string) {
    const actorMembership = await this.orgService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.USER_ADMIN,
    ]);

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

    const actorRole = (actorMembership as any)?.role || OrgRole.SUPER_ADMIN;

    if (userId === actorId && member.role === OrgRole.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN cannot delete self before ownership transfer');
    }

    if (member.role === OrgRole.SUPER_ADMIN && actorRole !== OrgRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can remove another SUPER_ADMIN');
    }

    await this.prisma.groupMember.deleteMany({
      where: {
        userId,
        group: {
          organizationId: orgId,
        },
      },
    });

    await this.prisma.organizationMember.delete({ where: { id: member.id } });

    return { success: true };
  }

  async assignGroups(orgId: string, userId: string, groupIds: string[]) {
    const userMembership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    if (!userMembership) {
      throw new NotFoundException('User not found in this organization');
    }

    const uniqueIds = Array.from(new Set(groupIds));

    const validGroups = await this.prisma.group.findMany({
      where: {
        id: { in: uniqueIds },
        organizationId: orgId,
      },
      select: { id: true },
    });

    const validGroupIds = validGroups.map((group) => group.id);

    await this.prisma.groupMember.deleteMany({
      where: {
        userId,
        group: { organizationId: orgId },
      },
    });

    if (validGroupIds.length > 0) {
      await this.prisma.groupMember.createMany({
        data: validGroupIds.map((groupId) => ({ userId, groupId })),
        skipDuplicates: true,
      });
    }

    return { success: true, groupIds: validGroupIds };
  }

  async assignApplications(orgId: string, userId: string, applicationIds: string[]) {
    const prismaAny = this.prisma as any;
    const userMembership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    if (!userMembership) {
      throw new NotFoundException('User not found in this organization');
    }

    const uniqueIds = Array.from(new Set(applicationIds));
    const validApps = await this.prisma.application.findMany({
      where: {
        id: { in: uniqueIds },
        organizationId: orgId,
        status: { not: 'ARCHIVED' },
      },
      select: { id: true },
    });

    const validApplicationIds = validApps.map((app) => app.id);

    await prismaAny.userApplicationAssignment.deleteMany({
      where: {
        userId,
        application: { organizationId: orgId },
      },
    });

    if (validApplicationIds.length > 0) {
      await prismaAny.userApplicationAssignment.createMany({
        data: validApplicationIds.map((applicationId) => ({ userId, applicationId })),
        skipDuplicates: true,
      });
    }

    return { success: true, applicationIds: validApplicationIds };
  }

  async assignGroup(orgId: string, userId: string, groupId: string, actorId: string) {
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

  async removeGroup(orgId: string, userId: string, groupId: string, actorId: string) {
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

  private async getOne(orgId: string, userId: string) {
    const member = await (this.prisma as any).organizationMember.findUnique({
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
            createdAt: true,
            lastLoginAt: true,
            mustChangePassword: true,
            groups: {
              where: { group: { organizationId: orgId } },
              include: { group: { select: { id: true, name: true } } },
            },
            applicationAssignments: {
              where: {
                application: { organizationId: orgId, status: { not: 'ARCHIVED' } },
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
      createdAt: member.user.createdAt,
      lastLoginAt: member.user.lastLoginAt,
      mustChangePassword: member.user.mustChangePassword,
      groups: member.user.groups.map((entry: any) => entry.group),
      applications: member.user.applicationAssignments.map((entry: any) => entry.application),
    };
  }

  private assertRoleHierarchy(actorRole: OrgRole, targetRole: OrgRole) {
    if (actorRole === OrgRole.SUPER_ADMIN) return;

    if (ROLE_WEIGHT[actorRole] <= ROLE_WEIGHT[targetRole]) {
      throw new ForbiddenException('Cannot assign role equal or higher than your own');
    }
  }
}
