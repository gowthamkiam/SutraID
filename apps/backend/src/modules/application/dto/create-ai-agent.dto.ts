import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsObject,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateAiAgentDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  agentVersion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @IsOptional()
  @IsEnum(['client_secret_post', 'client_secret_basic', 'private_key_jwt'])
  tokenEndpointAuthMethod?: string;

  @IsOptional()
  @IsObject()
  jwks?: any;

  @IsOptional()
  @IsBoolean()
  requireDpop?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(86400)
  maxTokenLifetime?: number;
}
