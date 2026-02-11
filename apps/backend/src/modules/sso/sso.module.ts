import { Module } from '@nestjs/common';
import { SsoController } from './sso.controller';
import { SsoAuthController } from './sso-auth.controller';
import { SsoService } from './sso.service';
import { SamlSpService } from './services/saml-sp.service';
import { OidcClientService } from './services/oidc-client.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [PrismaModule, OrganizationModule],
  controllers: [SsoController, SsoAuthController],
  providers: [SsoService, SamlSpService, OidcClientService],
  exports: [SsoService, SamlSpService, OidcClientService],
})
export class SsoModule {}
