import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard, RequirePermission } from '../rbac/rbac.guard';

@Controller('config')
@UseGuards(JwtAuthGuard, RbacGuard)
export class AppConfigController {
  constructor(private appConfigService: AppConfigService) {}

  @Get()
  @RequirePermission('org:read')
  async getConfig() {
    return this.appConfigService.get();
  }

  @Put()
  @RequirePermission('org:update')
  async updateConfig(@Body() data: any) {
    const { id, createdAt, updatedAt, ...updateData } = data;
    return this.appConfigService.update(updateData);
  }
}
