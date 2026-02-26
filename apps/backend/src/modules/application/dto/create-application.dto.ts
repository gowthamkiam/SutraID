import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsObject,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ApplicationProtocol } from '@prisma/client';
import { IsValidRedirectUri } from '../validators/redirect-uri.validator';

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

  @IsEnum(ApplicationProtocol)
  type: ApplicationProtocol;

  // OAuth/OIDC settings
  @IsArray()
  @IsString({ each: true })
  @IsValidRedirectUri()
  @IsOptional()
  redirectUris?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grantTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  responseTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @IsOptional()
  @IsString()
  tokenEndpointAuthMethod?: string;

  @IsOptional()
  @IsBoolean()
  isPublicClient?: boolean;

  // Security Features
  @IsOptional()
  @IsBoolean()
  requireDpop?: boolean;

  @IsOptional()
  @IsObject()
  jwks?: any;

  @IsOptional()
  @IsBoolean()
  dpopNonceEnabled?: boolean;

  // AI Agent specific
  @IsOptional()
  @IsBoolean()
  isAiAgent?: boolean;

  @IsOptional()
  @IsObject()
  aiAgentMetadata?: Record<string, any>;

  // Grant type controls
  @IsOptional()
  @IsBoolean()
  allowROPC?: boolean;

  @IsOptional()
  @IsBoolean()
  allowClientCredentials?: boolean;

  @IsOptional()
  @IsBoolean()
  allowRefreshForROPC?: boolean;

  @IsOptional()
  @IsBoolean()
  pkceRequired?: boolean;

  // SAML Identity Provider Configuration
  @IsOptional()
  @IsString()
  samlEntityId?: string;

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
  samlAttributeMapping?: Record<string, any>;
}
