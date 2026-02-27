import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SecurityMetricsService } from './security-metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('security-metrics')
export class SecurityMetricsController {
  constructor(private metricsService: SecurityMetricsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMetrics(@Query('days') days?: string) {
    const periodDays = days ? parseInt(days, 10) : 30;
    return this.metricsService.getMetrics(
      Math.min(Math.max(periodDays, 1), 365),
    );
  }
}
