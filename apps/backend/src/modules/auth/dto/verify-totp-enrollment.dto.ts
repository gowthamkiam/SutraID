import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyTotpEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  methodId: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
