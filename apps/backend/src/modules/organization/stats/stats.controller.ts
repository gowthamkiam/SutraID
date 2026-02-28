import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('active-sessions')
  async getActiveSessions() {
    return this.statsService.getActiveSessions();
  }
}
