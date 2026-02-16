import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { OauthController, OpenidConfigurationController } from './oauth.controller';
import { SamlController } from './saml.controller';
import { GuideController } from './guide.controller';
import { ApplicationUtils } from './utils/application.utils';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationModule } from '../organization/organization.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, OrganizationModule, AuthModule],
  controllers: [
    ApplicationController,
    OauthController,
    OpenidConfigurationController,
    SamlController,
    GuideController,
  ],
  providers: [ApplicationService, ApplicationUtils],
  exports: [ApplicationService],
})
export class ApplicationModule { }

