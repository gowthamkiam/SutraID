import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RbacGuard } from './rbac.guard';

@Module({
  imports: [PrismaModule],
  providers: [RbacGuard],
  exports: [RbacGuard],
})
export class RbacModule {}
