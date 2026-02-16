import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { OrgRole } from '@prisma/client';

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
}
