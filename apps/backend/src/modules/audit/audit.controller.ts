import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditResult } from '@prisma/client';

@Controller('organizations/:orgId/audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  /**
   * GET /api/v1/organizations/:orgId/audit/logs
   * Query audit logs with filters
   */
  @Get('logs')
  async getLogs(
    @Param('orgId') orgId: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('result') result?: AuditResult,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.query({
      organizationId: orgId,
      userId,
      action,
      result,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 50,
    });
  }

  /**
   * GET /api/v1/organizations/:orgId/audit/stats
   * Get audit log statistics
   */
  @Get('stats')
  async getStats(
    @Param('orgId') orgId: string,
    @Query('days') days?: string,
  ) {
    return this.auditService.getStats(
      orgId,
      days ? parseInt(days, 10) : 30,
    );
  }
}
