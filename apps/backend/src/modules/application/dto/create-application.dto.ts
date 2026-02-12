import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';
import { AppType } from '@prisma/client';

export class CreateApplicationDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsArray()
  @IsString({ each: true })
  redirectUris: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedOrigins?: string[];

  @IsEnum(AppType)
  type: AppType;

  // SAML Identity Provider Configuration (Phase 3)
  @IsOptional()
  @IsBoolean()
  samlIdpEnabled?: boolean;

  @IsOptional()
  @IsString()
  samlSpEntityId?: string;

  @IsOptional()
  @IsString()
  samlSpAcsUrl?: string;

  @IsOptional()
  @IsString()
  samlNameIdFormat?: string;

  @IsOptional()
  @IsObject()
  samlAttributeMapping?: Record<string, string>;

  // OIDC Identity Provider Configuration (Phase 3)
  @IsOptional()
  @IsBoolean()
  oidcIdpEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  oidcScopes?: string[];
}
