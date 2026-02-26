import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiAgentController } from './ai-agent.controller';
import { AiAgentService } from './ai-agent.service';
import { AiAgentAuthGuard } from './guards/ai-agent-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AiAgentController],
  providers: [AiAgentService, AiAgentAuthGuard],
  exports: [AiAgentService],
})
export class AiAgentModule {}
