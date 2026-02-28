import { Module } from '@nestjs/common';
import { SecurityMetricsService } from './security-metrics.service';
import { SecurityMetricsController } from './security-metrics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SecurityMetricsController],
  providers: [SecurityMetricsService],
  exports: [SecurityMetricsService],
})
export class SecurityMetricsModule { }
