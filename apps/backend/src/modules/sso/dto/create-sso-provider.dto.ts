import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUrl,
  ValidateIf,
  MaxLength,
} from 'class-validator';
import { SsoProviderType, SsoProtocol } from '@prisma/client';

export class CreateSsoProviderDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsEnum(SsoProviderType)
  type: SsoProviderType;

  @IsEnum(SsoProtocol)
  protocol: SsoProtocol;

  // SAML Configuration (required if protocol is SAML2)
  @ValidateIf((o) => o.protocol === SsoProtocol.SAML2)
  @IsString()
  samlEntityId?: string;

  @ValidateIf((o) => o.protocol === SsoProtocol.SAML2)
  @IsUrl()
  samlSsoUrl?: string;

  @ValidateIf((o) => o.protocol === SsoProtocol.SAML2)
  @IsString()
  samlCertificate?: string;

  @IsOptional()
  @IsUrl()
  samlMetadataUrl?: string;

  // OIDC Configuration (required if protocol is OIDC)
  @ValidateIf((o) => o.protocol === SsoProtocol.OIDC)
  @IsUrl()
  oidcIssuer?: string;

  @ValidateIf((o) => o.protocol === SsoProtocol.OIDC)
  @IsString()
  oidcClientId?: string;

  @ValidateIf((o) => o.protocol === SsoProtocol.OIDC)
  @IsString()
  oidcClientSecret?: string;

  @IsOptional()
  @IsUrl()
  oidcAuthUrl?: string;

  @IsOptional()
  @IsUrl()
  oidcTokenUrl?: string;

  @IsOptional()
  @IsUrl()
  oidcUserinfoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  oidcScopes?: string[];

  // Attribute Mapping (JSON object)
  @IsOptional()
  attributeMapping?: Record<string, string>;

  // Settings
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  autoProvision?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];
}
