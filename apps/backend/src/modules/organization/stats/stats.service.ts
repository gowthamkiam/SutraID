import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getActiveSessions() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const count = await this.prisma.user.count({
      where: {
        lastLoginAt: { gte: last24h },
      },
    });

    return {
      activeSessions: count,
      periodHours: 24,
    };
  }
}
