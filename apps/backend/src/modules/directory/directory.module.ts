import { Module } from '@nestjs/common';
import { SCIMController } from './controllers/scim.controller';
import { LDAPController } from './controllers/ldap.controller';
import { DirectoryScimController } from './controllers/directory-scim.controller';
import { SCIMService } from './services/scim.service';
import { LDAPService } from './services/ldap.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
    imports: [PrismaModule, AuthModule, RbacModule],
    controllers: [SCIMController, LDAPController, DirectoryScimController],
    providers: [SCIMService, LDAPService],
    exports: [SCIMService, LDAPService],
})
export class DirectoryModule { }
