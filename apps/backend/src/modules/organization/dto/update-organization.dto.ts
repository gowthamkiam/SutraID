import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  MaxLength,
  Matches,
  IsHexColor,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { OrgPlan, OrgStatus } from '@prisma/client';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @IsOptional()
  @IsEmail()
  domain?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @IsOptional()
  @IsEnum(OrgPlan)
  plan?: OrgPlan;

  @IsOptional()
  @IsEnum(OrgStatus)
  status?: OrgStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxMembers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxApplications?: number;
}
