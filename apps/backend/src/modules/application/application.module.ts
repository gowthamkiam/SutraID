import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationModule } from '../organization/organization.module';
import { AuthModule } from '../auth/auth.module';
import { SsoModule } from '../sso/sso.module';

@Module({
  imports: [PrismaModule, OrganizationModule, AuthModule, SsoModule],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
