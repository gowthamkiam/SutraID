import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateSsoProviderDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  // SAML Configuration
  @IsOptional()
  @IsString()
  samlEntityId?: string;

  @IsOptional()
  @IsUrl()
  samlSsoUrl?: string;

  @IsOptional()
  @IsString()
  samlCertificate?: string;

  @IsOptional()
  @IsUrl()
  samlMetadataUrl?: string;

  // OIDC Configuration
  @IsOptional()
  @IsUrl()
  oidcIssuer?: string;

  @IsOptional()
  @IsString()
  oidcClientId?: string;

  @IsOptional()
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

  // Attribute Mapping
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
