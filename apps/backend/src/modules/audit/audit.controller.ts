import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../organization/guards/org-context.guard';
import { RbacGuard, RequirePermission } from '../rbac/rbac.guard';
import { AuditResult } from '@prisma/client';
import { Request } from '@nestjs/common';

@Controller('organizations/:orgId/audit')
@UseGuards(JwtAuthGuard, OrgContextGuard, RbacGuard)
export class AuditController {
  constructor(private auditService: AuditService) { }

  /**
   * GET /api/v1/organizations/:orgId/audit/logs
   * Query audit logs with filters
   */
  @Get('logs')
  @RequirePermission('audit:read')
  async getLogs(
    @Param('orgId') orgId: string,
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('result') result?: AuditResult,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.query(orgId, req.user.id, {
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
  @RequirePermission('audit:read')
  async getStats(
    @Param('orgId') orgId: string,
    @Req() req: any,
    @Query('days') days?: string,
  ) {
    return this.auditService.getStats(
      orgId,
      req.user.id,
      days ? parseInt(days, 10) : 30,
    );
  }
}
