import { IsString, IsObject, IsOptional } from 'class-validator';

export class ExecuteToolDto {
  @IsString()
  tool_name: string;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}
