import { IsNotEmpty, MinLength } from 'class-validator';
import { IsStrongPassword } from '../validators/password.validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @IsStrongPassword()
  newPassword: string;
}
