import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { OrganizationSettingsController } from './settings/organization-settings.controller';
import { OrganizationSettingsService } from './settings/organization-settings.service';
import { OrganizationAccessGuard } from './guards/organization-access.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrganizationController, OrganizationSettingsController],
  providers: [OrganizationService, OrganizationSettingsService, OrganizationAccessGuard],
  exports: [OrganizationService, OrganizationAccessGuard],
})
export class OrganizationModule { }
