import { Module } from '@nestjs/common';
import { SecurityMetricsService } from './security-metrics.service';
import { SecurityMetricsController } from './security-metrics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecurityMetricsController],
  providers: [SecurityMetricsService],
  exports: [SecurityMetricsService],
})
export class SecurityMetricsModule {}
