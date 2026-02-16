import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditResult, OrgRole } from '@prisma/client';
import { OrganizationService } from '../organization/organization.service';

export interface AuditEvent {
  organizationId?: string;
  userId?: string;
  agentId?: string;
  action: string;
  resource?: string;
  result?: AuditResult;
  metadata?: Record<string, any>;
  riskScore?: number;
}

@Injectable()
export class AuditService {
  constructor(
    private prisma: PrismaService,
    private organizationService: OrganizationService,
  ) { }

  /**
   * Log an audit event (append-only, never update/delete)
   */
  async log(event: AuditEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId: event.organizationId || null,
          userId: event.userId || null,
          agentId: event.agentId || null,
          action: event.action,
          resource: event.resource || null,
          result: event.result || 'SUCCESS',
          metadata: event.metadata || {},
          riskScore: event.riskScore || null,
        },
      });
    } catch (error) {
      // Audit logging should never break the main flow
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * Query audit logs with filters
   */
  async query(
    organizationId: string,
    actorId: string,
    params: {
      userId?: string;
      action?: string;
      result?: AuditResult;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    // Check permission
    await this.organizationService.checkPermission(organizationId, actorId, [
      // @ts-ignore
      OrgRole.SUPER_ADMIN,
      // @ts-ignore
      OrgRole.ORG_ADMIN,
      // @ts-ignore
      OrgRole.REPORT_ADMIN,
    ]);

    const {
      userId,
      action,
      result,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = params;

    const where: any = {};

    if (organizationId) where.organizationId = organizationId;
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };
    if (result) where.result = result;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit log statistics for an organization
   */
  async getStats(organizationId: string, actorId: string, days: number = 30) {
    // Check permission
    await this.organizationService.checkPermission(organizationId, actorId, [
      // @ts-ignore
      OrgRole.SUPER_ADMIN,
      // @ts-ignore
      OrgRole.ORG_ADMIN,
      // @ts-ignore
      OrgRole.REPORT_ADMIN,
    ]);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalEvents, byAction, byResult] = await Promise.all([
      this.prisma.auditLog.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { organizationId, createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['result'],
        where: { organizationId, createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    return {
      totalEvents,
      byAction: byAction.map((a) => ({ action: a.action, count: a._count })),
      byResult: byResult.map((r) => ({ result: r.result, count: r._count })),
      periodDays: days,
    };
  }
}
