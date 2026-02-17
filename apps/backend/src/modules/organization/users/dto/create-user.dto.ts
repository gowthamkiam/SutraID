import { IsArray, IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { OrgRole } from '@prisma/client';

export enum UserOnboardingMethod {
  MAGIC_LINK = 'MAGIC_LINK',
  TEMP_PASSWORD = 'TEMP_PASSWORD',
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  groupIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  applicationIds?: string[];

  @IsOptional()
  @IsEnum(UserOnboardingMethod)
  onboardingMethod?: UserOnboardingMethod;

  @IsOptional()
  @IsString()
  @MinLength(8)
  temporaryPassword?: string;
}
