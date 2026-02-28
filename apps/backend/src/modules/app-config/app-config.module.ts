import { Module, forwardRef } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { AppConfigController } from './app-config.controller';
import { OrgController } from './org.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), RbacModule],
  controllers: [AppConfigController, OrgController],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
