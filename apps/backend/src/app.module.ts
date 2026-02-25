import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ApplicationModule } from './modules/application/application.module';
import { SsoModule } from './modules/sso/sso.module';
import { AuditModule } from './modules/audit/audit.module';
import { PolicyModule } from './modules/policy/policy.module';
import { DirectoryModule } from './modules/directory/directory.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { StatsModule } from './modules/organization/stats/stats.module';

@Module({
  imports: [
    // Configuration module (loads .env)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Database module (Prisma ORM)
    PrismaModule,
    // Audit logging module (global — available to all modules)
    AuditModule,
    // Authentication module
    AuthModule,
    // Organization module (multi-tenancy)
    OrganizationModule,
    // Application module (OAuth apps)
    ApplicationModule,
    // SSO module (SAML/OIDC Service Provider)
    SsoModule,
    // Policy engine module (authorization)
    PolicyModule,
    // Directory integration module (SCIM & LDAP)
    DirectoryModule,
    // RBAC module (permission-based access control)
    RbacModule,
    // Stats module (dashboard metrics)
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
