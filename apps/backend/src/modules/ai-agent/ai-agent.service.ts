import { Injectable } from '@nestjs/common';
import { ExecuteToolDto } from './dto/execute-tool.dto';

@Injectable()
export class AiAgentService {
  async executeTool(
    orgId: string,
    agentId: string,
    dto: ExecuteToolDto,
  ): Promise<any> {
    const toolHandlers: Record<string, (params: any) => any> = {
      calculator: (params) => {
        const { op, a, b } = params;
        switch (op) {
          case 'add': return { result: a + b };
          case 'subtract': return { result: a - b };
          case 'multiply': return { result: a * b };
          case 'divide': return { result: a / b };
          default: throw new Error(`Unknown operation: ${op}`);
        }
      },
      echo: (params) => params,
    };

    const handler = toolHandlers[dto.tool_name];
    if (!handler) {
      return {
        error: `Tool '${dto.tool_name}' not found`,
        available_tools: Object.keys(toolHandlers),
      };
    }

    return {
      tool: dto.tool_name,
      agent_id: agentId,
      organization_id: orgId,
      result: handler(dto.parameters || {}),
      executed_at: new Date().toISOString(),
    };
  }
}
