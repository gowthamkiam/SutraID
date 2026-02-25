import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationService } from '../organization.service';
import { OrgRole } from '@prisma/client';

@Injectable()
export class StatsService {
  constructor(
    private prisma: PrismaService,
    private organizationService: OrganizationService,
  ) {}

  async getActiveSessions(organizationId: string, actorId: string) {
    await this.organizationService.checkPermission(organizationId, actorId, [
      // @ts-ignore
      OrgRole.SUPER_ADMIN,
      // @ts-ignore
      OrgRole.ORG_ADMIN,
      // @ts-ignore
      OrgRole.REPORT_ADMIN,
    ]);

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const count = await this.prisma.user.count({
      where: {
        organizationId,
        lastLoginAt: { gte: last24h },
      },
    });

    return {
      activeSessions: count,
      periodHours: 24,
    };
  }
}
