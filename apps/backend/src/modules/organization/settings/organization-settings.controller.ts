import {
  Body,
  Controller,
  Get,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrganizationSettingsService } from './organization-settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../guards/org-context.guard';
import { RbacGuard, RequirePermission } from '../../rbac/rbac.guard';

@Controller('org')
@UseGuards(JwtAuthGuard, OrgContextGuard, RbacGuard)
export class OrganizationSettingsController {
  constructor(private readonly settingsService: OrganizationSettingsService) {}

  @Get()
  @RequirePermission('org:read')
  async getOrg(@Request() req: any) {
    return this.settingsService.findOrg(req.orgId);
  }

  @Put()
  @RequirePermission('org:update')
  async updateOrg(
    @Request() req: any,
    @Body() payload: { name?: string; settings?: Record<string, string> },
  ) {
    return this.settingsService.updateOrg(req.orgId, req.user.id, payload);
  }
}
