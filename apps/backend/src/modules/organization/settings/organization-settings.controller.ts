import {
  Body,
  Controller,
  Get,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AppConfigService } from '../../app-config/app-config.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard, RequirePermission } from '../../rbac/rbac.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard, RbacGuard)
export class OrganizationSettingsController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get()
  @RequirePermission('org:read')
  async getOrg() {
    return this.appConfigService.get();
  }

  @Put()
  @RequirePermission('org:update')
  async updateOrg(
    @Body() payload: { name?: string; logoUrl?: string; primaryColor?: string; customLoginConfig?: any },
  ) {
    return this.appConfigService.update(payload);
  }
}
