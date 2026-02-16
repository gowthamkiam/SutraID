import { IsArray, IsEnum, IsOptional, IsUUID, IsString } from 'class-validator';
import { OrgRole, UserStatus } from '@prisma/client';

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
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  groupIds?: string[];
}
