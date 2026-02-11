import { Module } from '@nestjs/common';
import { SsoController } from './sso.controller';
import { SsoAuthController } from './sso-auth.controller';
import { SamlIdpController } from './controllers/saml-idp.controller';
import { OidcIdpController } from './controllers/oidc-idp.controller';
import { SsoService } from './sso.service';
import { SamlSpService } from './services/saml-sp.service';
import { SamlIdpService } from './services/saml-idp.service';
import { OidcIdpService } from './services/oidc-idp.service';
import { OidcClientService } from './services/oidc-client.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationModule } from '../organization/organization.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, OrganizationModule, AuthModule],
  controllers: [SsoController, SsoAuthController, SamlIdpController, OidcIdpController],
  providers: [SsoService, SamlSpService, SamlIdpService, OidcIdpService, OidcClientService],
  exports: [SsoService, SamlSpService, SamlIdpService, OidcIdpService, OidcClientService],
})
export class SsoModule {}
