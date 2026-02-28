import { Test, TestingModule } from '@nestjs/testing';
import { AiAgentService } from './ai-agent.service';

describe('AiAgentService', () => {
    let service: AiAgentService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AiAgentService],
        }).compile();

        service = module.get<AiAgentService>(AiAgentService);
    });

    describe('executeTool', () => {
        it('should execute calculator tool', async () => {
            const result = await service.executeTool('agent-1', {
                tool_name: 'calculator',
                parameters: { op: 'add', a: 5, b: 3 },
            });

            expect(result.result).toEqual({ result: 8 });
            expect(result.tool).toBe('calculator');
        });

        it('should execute echo tool', async () => {
            const result = await service.executeTool('agent-1', {
                tool_name: 'echo',
                parameters: { message: 'hello' },
            });

            expect(result.result).toEqual({ message: 'hello' });
        });

        it('should return error for unknown tool', async () => {
            const result = await service.executeTool('agent-1', {
                tool_name: 'unknown_tool',
            });

            expect(result.error).toBe("Tool 'unknown_tool' not found");
            expect(result.available_tools).toContain('calculator');
            expect(result.available_tools).toContain('echo');
        });

        it('should return error for prototype methods (security check)', async () => {
            const result = await service.executeTool('agent-1', {
                tool_name: 'toString',
            });

            expect(result.error).toBe("Tool 'toString' not found");
            expect(result.available_tools).not.toContain('toString');
        });
    });
});
