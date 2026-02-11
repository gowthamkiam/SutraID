import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { OrganizationAccessGuard } from './guards/organization-access.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationAccessGuard],
  exports: [OrganizationService, OrganizationAccessGuard],
})
export class OrganizationModule {}
