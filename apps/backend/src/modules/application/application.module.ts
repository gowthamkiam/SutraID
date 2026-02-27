import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { OauthController, OpenidConfigurationController } from './oauth.controller';
import { SamlController } from './saml.controller';
import { GuideController } from './guide.controller';
import { ApplicationUtils } from './utils/application.utils';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SsoModule } from '../sso/sso.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SsoModule,
    ThrottlerModule.forRoot([{
      name: 'ropc',
      ttl: 60000,
      limit: 5,
    }]),
  ],
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
