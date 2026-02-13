import { IsString, IsOptional, IsArray, IsInt, IsBoolean, IsEnum, IsNotEmpty, IsObject, Min } from 'class-validator';

export enum PolicyEffectDto {
  ALLOW = 'ALLOW',
  DENY = 'DENY',
}

export class CreatePolicyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PolicyEffectDto)
  @IsOptional()
  effect?: PolicyEffectDto;

  @IsString()
  @IsNotEmpty()
  resource: string;

  @IsArray()
  @IsString({ each: true })
  actions: string[];

  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
