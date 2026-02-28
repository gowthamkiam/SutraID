import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard, RequirePermission } from '../rbac/rbac.guard';

@Controller('org')
@UseGuards(JwtAuthGuard, RbacGuard)
export class OrgController {
  constructor(private appConfigService: AppConfigService) {}

  @Get()
  @RequirePermission('org:read')
  async getOrg() {
    const config = await this.appConfigService.get();
    return {
      id: config.id,
      name: config.name,
      slug: config.name.toLowerCase().replace(/\s+/g, '-'),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      settings: {
        'security.mfa_required': String(config.mfaRequired),
        'security.mfa_grace_period_days': String(config.mfaGracePeriodDays),
        'branding.primary_color': config.primaryColor,
        'branding.logo_url': config.logoUrl || '',
        ...((config.customLoginConfig as Record<string, string>) || {}),
      },
    };
  }

  @Put()
  @RequirePermission('org:update')
  async updateOrg(@Body() data: { name?: string; settings?: Record<string, string> }) {
    const updateData: Record<string, any> = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.settings) {
      const extraSettings: Record<string, string> = {};

      for (const [key, value] of Object.entries(data.settings)) {
        switch (key) {
          case 'security.mfa_required':
            updateData.mfaRequired = value === 'true';
            break;
          case 'security.mfa_grace_period_days':
            updateData.mfaGracePeriodDays = parseInt(value, 10) || 7;
            break;
          case 'branding.primary_color':
            updateData.primaryColor = value;
            break;
          case 'branding.logo_url':
            updateData.logoUrl = value || null;
            break;
          default:
            extraSettings[key] = value;
            break;
        }
      }

      if (Object.keys(extraSettings).length > 0) {
        const existing = await this.appConfigService.get();
        const merged = {
          ...((existing.customLoginConfig as Record<string, string>) || {}),
          ...extraSettings,
        };
        updateData.customLoginConfig = merged;
      }
    }

    const config = await this.appConfigService.update(updateData);
    return {
      id: config.id,
      name: config.name,
      slug: config.name.toLowerCase().replace(/\s+/g, '-'),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      settings: {
        'security.mfa_required': String(config.mfaRequired),
        'security.mfa_grace_period_days': String(config.mfaGracePeriodDays),
        'branding.primary_color': config.primaryColor,
        'branding.logo_url': config.logoUrl || '',
        ...((config.customLoginConfig as Record<string, string>) || {}),
      },
    };
  }
}
