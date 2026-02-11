import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyMagicLinkDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
