import { IsString, IsNotEmpty, IsOptional, IsBoolean, Length } from 'class-validator';

export class VerifyMfaChallengeDto {
  @IsString()
  @IsNotEmpty()
  mfaToken: string;

  @IsString()
  @Length(6, 8)
  code: string;

  @IsOptional()
  @IsBoolean()
  isBackupCode?: boolean;
}
