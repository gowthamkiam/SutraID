import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { AiAgentAuthGuard } from './guards/ai-agent-auth.guard';
import { ExecuteToolDto } from './dto/execute-tool.dto';

@Controller('ai/agents')
export class AiAgentController {
  constructor(private aiAgentService: AiAgentService) {}

  @Get('me')
  @UseGuards(AiAgentAuthGuard)
  async getIdentity(@Req() req: any) {
    return {
      agent_id: req.agent.id,
      organization_id: req.agent.orgId,
      scopes: req.agent.scopes,
      version: req.agent.version,
    };
  }

  @Post('execute')
  @UseGuards(AiAgentAuthGuard)
  async executeTool(@Req() req: any, @Body() dto: ExecuteToolDto) {
    const requiredScope = `ai:tool:${dto.tool_name}`;
    if (
      !req.agent.scopes.includes('ai:tool:call') &&
      !req.agent.scopes.includes(requiredScope)
    ) {
      throw new ForbiddenException('Insufficient scope for this tool');
    }

    return this.aiAgentService.executeTool(
      req.agent.orgId,
      req.agent.id,
      dto,
    );
  }
}
