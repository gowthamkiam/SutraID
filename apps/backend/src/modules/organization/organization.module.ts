import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { OrganizationSettingsController } from './settings/organization-settings.controller';
import { OrganizationSettingsService } from './settings/organization-settings.service';
import { OrganizationAccessGuard } from './guards/organization-access.guard';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { GroupsController } from './groups/groups.controller';
import { GroupsService } from './groups/groups.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, AuthModule, RbacModule],
  controllers: [
    OrganizationController,
    OrganizationSettingsController,
    UsersController,
    GroupsController,
  ],
  providers: [
    OrganizationService,
    OrganizationSettingsService,
    OrganizationAccessGuard,
    UsersService,
    GroupsService,
  ],
  exports: [OrganizationService, OrganizationAccessGuard],
})
export class OrganizationModule {}
