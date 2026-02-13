import { IsString, IsOptional, IsArray, IsInt, IsBoolean, IsEnum, IsObject, Min } from 'class-validator';
import { PolicyEffectDto } from './create-policy.dto';

export class UpdatePolicyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PolicyEffectDto)
  @IsOptional()
  effect?: PolicyEffectDto;

  @IsString()
  @IsOptional()
  resource?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  actions?: string[];

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
