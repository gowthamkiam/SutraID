import { Module } from '@nestjs/common';
import { SCIMController } from './controllers/scim.controller';
import { LDAPController } from './controllers/ldap.controller';
import { SCIMService } from './services/scim.service';
import { LDAPService } from './services/ldap.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationModule } from '../organization/organization.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, OrganizationModule, AuthModule],
    controllers: [SCIMController, LDAPController],
    providers: [SCIMService, LDAPService],
    exports: [SCIMService, LDAPService],
})
export class DirectoryModule { }
