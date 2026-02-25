import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrganizationModule } from '../organization.module';

@Module({
  imports: [PrismaModule, OrganizationModule],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
