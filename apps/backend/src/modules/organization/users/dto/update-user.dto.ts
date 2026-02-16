import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrgRole } from '@prisma/client';

export class UpdateUserDto {
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
  @IsString()
  status?: 'ACTIVE' | 'SUSPENDED';
}
