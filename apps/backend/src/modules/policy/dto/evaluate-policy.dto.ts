import { IsString, IsOptional, IsNotEmpty, IsObject } from 'class-validator';

export class EvaluatePolicyDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  agentId?: string;

  @IsString()
  @IsNotEmpty()
  resource: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}
