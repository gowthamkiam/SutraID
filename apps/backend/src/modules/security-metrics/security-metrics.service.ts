import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SecurityMetricsService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      mfaEnabledUsers,
      fido2Methods,
      totpMethods,
      failedLogins,
      successfulLogins,
      mfaEnrollments,
      mfaVerifications,
      recentAuditEvents,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { mfaEnabled: true } }),
      this.prisma.mfaMethod.count({
        where: { type: 'FIDO2', enabled: true, verified: true },
      }),
      this.prisma.mfaMethod.count({
        where: { type: 'TOTP', enabled: true, verified: true },
      }),
      this.prisma.auditLog.count({
        where: {
          action: { contains: 'login' },
          result: 'FAILURE',
          createdAt: { gte: since },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          action: { contains: 'login' },
          result: 'SUCCESS',
          createdAt: { gte: since },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          action: 'user.mfa.enrolled',
          createdAt: { gte: since },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          action: 'user.mfa.verified',
          createdAt: { gte: since },
        },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
    ]);

    const mfaAdoptionRate =
      totalUsers > 0 ? Math.round((mfaEnabledUsers / totalUsers) * 100) : 0;

    const loginSuccessRate =
      successfulLogins + failedLogins > 0
        ? Math.round(
            (successfulLogins / (successfulLogins + failedLogins)) * 100,
          )
        : 100;

    return {
      periodDays: days,
      generatedAt: new Date().toISOString(),
      mfa: {
        adoptionRate: mfaAdoptionRate,
        totalUsers,
        usersWithMfa: mfaEnabledUsers,
        usersWithoutMfa: totalUsers - mfaEnabledUsers,
        methods: {
          totp: totpMethods,
          fido2: fido2Methods,
        },
        enrollmentsLastPeriod: mfaEnrollments,
        verificationsLastPeriod: mfaVerifications,
      },
      authentication: {
        successfulLogins,
        failedLogins,
        loginSuccessRate,
      },
      topEvents: recentAuditEvents.map((e) => ({
        action: e.action,
        count: e._count,
      })),
    };
  }
}
