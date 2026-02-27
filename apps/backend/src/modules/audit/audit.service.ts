import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditResult } from '@prisma/client';

export interface AuditEvent {
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
  ) { }

  async log(event: AuditEvent): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
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
      console.error('Failed to write audit log:', error);
    }
  }

  async query(
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

  async getStats(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalEvents, byAction, byResult] = await Promise.all([
      this.prisma.auditLog.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['result'],
        where: { createdAt: { gte: since } },
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
