import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  CustomizeLoginDto,
} from './dto';
import { OrgRole, MemberStatus } from '@prisma/client';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) { }

  /**
   * Create a new organization with the creator as SUPER_ADMIN
   */
  async create(userId: string, dto: CreateOrganizationDto) {
    // Check if slug is already taken
    const existing = await this.prisma.organization.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Organization slug is already taken');
    }

    // Check if domain is already claimed
    if (dto.domain) {
      const existingDomain = await this.prisma.organization.findUnique({
        where: { domain: dto.domain },
      });

      if (existingDomain) {
        throw new ConflictException('Domain is already claimed by another organization');
      }
    }

    // Create organization with creator as SUPER_ADMIN
    const organization = await this.prisma.organization.create({
      data: {
        ...dto,
        members: {
          create: {
            userId,
            role: OrgRole.SUPER_ADMIN,
            status: MemberStatus.ACTIVE,
            joinedAt: new Date(),
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

    return organization;
  }

  /**
   * Get all organizations for a user
   */
  async findUserOrganizations(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        userId,
        status: MemberStatus.ACTIVE,
      },
      include: {
        organization: {
          include: {
            _count: {
              select: {
                members: true,
                applications: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      memberCount: m.organization._count.members,
      applicationCount: m.organization._count.applications,
    }));
  }

  /**
   * Get organization by ID (with access check)
   */
  async findOne(orgId: string, userId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
      include: {
        organization: {
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
            _count: {
              select: {
                applications: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Organization not found or access denied');
    }

    return {
      ...membership.organization,
      userRole: membership.role,
    };
  }

  /**
   * Update organization settings (requires SUPER_ADMIN or ADMIN role)
   */
  async update(orgId: string, userId: string, dto: UpdateOrganizationDto) {
    // Check if user has permission (SUPER_ADMIN or ADMIN)
    await this.checkPermission(orgId, userId, [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN]);

    // If changing slug, check availability
    if (dto.slug) {
      const existing = await this.prisma.organization.findFirst({
        where: {
          slug: dto.slug,
          id: { not: orgId },
        },
      });

      if (existing) {
        throw new ConflictException('Slug is already taken');
      }
    }

    // If changing domain, check availability
    if (dto.domain) {
      const existing = await this.prisma.organization.findFirst({
        where: {
          domain: dto.domain,
          id: { not: orgId },
        },
      });

      if (existing) {
        throw new ConflictException('Domain is already claimed');
      }
    }

    return this.prisma.organization.update({
      where: { id: orgId },
      data: dto,
    });
  }

  /**
   * Delete organization (requires SUPER_ADMIN role)
   */
  async remove(orgId: string, userId: string) {
    // Only SUPER_ADMIN can delete
    await this.checkPermission(orgId, userId, [OrgRole.SUPER_ADMIN]);

    // Soft delete by setting status to DELETED
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { status: 'DELETED' },
    });
  }

  /**
   * Invite a member to the organization
   */
  async inviteMember(orgId: string, inviterId: string, dto: InviteMemberDto) {
    // Check if inviter has permission (SUPER_ADMIN or ADMIN)
    await this.checkPermission(orgId, inviterId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
    ]);

    // Get organization to check limits
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Check member limit
    if (org._count.members >= org.maxMembers) {
      throw new BadRequestException(
        `Organization has reached maximum member limit (${org.maxMembers})`,
      );
    }

    // Only SUPER_ADMIN can invite another SUPER_ADMIN
    if (dto.role === OrgRole.SUPER_ADMIN) {
      await this.checkPermission(orgId, inviterId, [OrgRole.SUPER_ADMIN]);
    }

    // Find or create user by email
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Create user account (will need to verify email later)
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          emailVerified: false,
          status: 'ACTIVE',
        },
      });
    }

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

    // Create membership
    return this.prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        role: dto.role,
        status: MemberStatus.PENDING_INVITATION,
        invitedBy: inviterId,
        invitedAt: new Date(),
      },
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
    });
  }

  /**
   * Update member role (requires SUPER_ADMIN or ADMIN)
   */
  async updateMemberRole(
    orgId: string,
    memberId: string,
    actorId: string,
    dto: UpdateMemberRoleDto,
  ) {
    // Check if actor has permission
    const actorMembership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: actorId,
        },
      },
    });

    if (!actorMembership || actorMembership.status !== MemberStatus.ACTIVE) {
      throw new ForbiddenException('Access denied');
    }

    // Only SUPER_ADMIN and ADMIN can change roles
    const allowedRoles: OrgRole[] = [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN];
    if (!allowedRoles.includes(actorMembership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Only SUPER_ADMIN can promote to SUPER_ADMIN
    if (dto.role === OrgRole.SUPER_ADMIN && actorMembership.role !== OrgRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can promote to SUPER_ADMIN role');
    }

    // Cannot change your own role
    if (memberId === actorId) {
      throw new BadRequestException('Cannot change your own role');
    }

    return this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: dto.role },
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
    });
  }

  /**
   * Remove member from organization (requires SUPER_ADMIN or ADMIN)
   */
  async removeMember(orgId: string, memberId: string, actorId: string) {
    // Check if actor has permission
    const actorMembership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: actorId,
        },
      },
    });

    if (!actorMembership || actorMembership.status !== MemberStatus.ACTIVE) {
      throw new ForbiddenException('Access denied');
    }

    const allowedRoles: OrgRole[] = [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN];
    if (!allowedRoles.includes(actorMembership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Cannot remove yourself
    if (memberId === actorId) {
      throw new BadRequestException('Cannot remove yourself');
    }

    // Get target member
    const targetMember = await this.prisma.organizationMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.organizationId !== orgId) {
      throw new NotFoundException('Member not found');
    }

    // Only SUPER_ADMIN can remove another SUPER_ADMIN
    if (
      targetMember.role === OrgRole.SUPER_ADMIN &&
      actorMembership.role !== OrgRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only SUPER_ADMIN can remove another SUPER_ADMIN');
    }

    // Delete membership
    return this.prisma.organizationMember.delete({
      where: { id: memberId },
    });
  }

  /**
   * Check if user has required permission in organization
   */
  async checkPermission(
    orgId: string,
    userId: string,
    requiredRoles: OrgRole[],
  ) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== MemberStatus.ACTIVE) {
      throw new ForbiddenException('Access denied');
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return membership;
  }

  /**
   * Get user's role in organization
   */
  async getUserRole(orgId: string, userId: string): Promise<OrgRole | null> {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId,
        },
      },
    });

    return membership?.status === MemberStatus.ACTIVE ? membership.role : null;
  }

  async customizeLogin(orgId: string, userId: string, dto: CustomizeLoginDto) {
    await this.checkPermission(orgId, userId, [OrgRole.SUPER_ADMIN]);

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const existing = (org.customLoginConfig as Record<string, unknown>) || {};
    const merged = { ...existing };
    if (dto.logoUrl !== undefined) merged.logoUrl = dto.logoUrl;
    if (dto.primaryColor !== undefined) merged.primaryColor = dto.primaryColor;
    if (dto.backgroundColor !== undefined) merged.backgroundColor = dto.backgroundColor;
    if (dto.customCss !== undefined) merged.customCss = dto.customCss;
    if (dto.customHtmlTemplate !== undefined) merged.customHtmlTemplate = dto.customHtmlTemplate;

    return this.prisma.organization.update({
      where: { id: orgId },
      data: { customLoginConfig: merged as any },
    });
  }
}
