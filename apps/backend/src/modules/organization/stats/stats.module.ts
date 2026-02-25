import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrganizationModule } from '../organization.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [PrismaModule, OrganizationModule, AuthModule],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
