import { IsEnum, IsOptional, IsString, IsNumberString } from 'class-validator';
import { OrgRole } from '@prisma/client';

export class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
