import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrgRole, OrganizationSetting } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationService } from '../organization.service';

@Injectable()
export class OrganizationSettingsService {
  constructor(
    private prisma: PrismaService,
    private organizationService: OrganizationService,
  ) {}

  async findAll(orgId: string, actorId: string) {
    await this.organizationService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
    ]);

    const settings = await this.prisma.organizationSetting.findMany({
      where: { organizationId: orgId },
    });

    return settings.reduce((acc: Record<string, string>, curr: OrganizationSetting) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
  }

  async update(orgId: string, actorId: string, key: string, value: string) {
    await this.organizationService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
    ]);

    return this.prisma.organizationSetting.upsert({
      where: {
        organizationId_key: {
          organizationId: orgId,
          key,
        },
      },
      update: {
        value,
        updatedBy: actorId,
      },
      create: {
        organizationId: orgId,
        key,
        value,
        updatedBy: actorId,
      },
    });
  }

  async updateBatch(orgId: string, actorId: string, settings: Record<string, string>) {
    await this.organizationService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
    ]);

    const operations = Object.entries(settings).map(([key, value]) =>
      this.prisma.organizationSetting.upsert({
        where: {
          organizationId_key: {
            organizationId: orgId,
            key,
          },
        },
        update: {
          value,
          updatedBy: actorId,
        },
        create: {
          organizationId: orgId,
          key,
          value,
          updatedBy: actorId,
        },
      }),
    );

    await this.prisma.$transaction(operations);

    return this.findAll(orgId, actorId);
  }

  async findOrg(orgId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        settings: {
          select: {
            key: true,
            value: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      settings: organization.settings.reduce((acc: Record<string, string>, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {}),
    };
  }

  async updateOrg(
    orgId: string,
    actorId: string,
    payload: { name?: string; settings?: Record<string, string> },
  ) {
    await this.organizationService.checkPermission(orgId, actorId, [
      OrgRole.SUPER_ADMIN,
    ]);

    if (!payload.name && !payload.settings) {
      throw new BadRequestException('No organization changes provided');
    }

    const operations: any[] = [];

    if (payload.name) {
      operations.push(
        this.prisma.organization.update({
          where: { id: orgId },
          data: { name: payload.name },
        }),
      );
    }

    if (payload.settings) {
      for (const [key, value] of Object.entries(payload.settings)) {
        operations.push(
          this.prisma.organizationSetting.upsert({
            where: {
              organizationId_key: {
                organizationId: orgId,
                key,
              },
            },
            update: {
              value,
              updatedBy: actorId,
            },
            create: {
              organizationId: orgId,
              key,
              value,
              updatedBy: actorId,
            },
          }),
        );
      }
    }

    if (operations.length) {
      await this.prisma.$transaction(operations);
    }

    return this.findOrg(orgId);
  }
}
