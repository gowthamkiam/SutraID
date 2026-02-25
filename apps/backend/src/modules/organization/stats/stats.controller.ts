import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('organizations/:orgId/stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('active-sessions')
  async getActiveSessions(
    @Param('orgId') orgId: string,
    @Req() req: any,
  ) {
    return this.statsService.getActiveSessions(orgId, req.user.id);
  }
}
