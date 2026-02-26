import { IsNotEmpty, MinLength } from 'class-validator';
import { IsStrongPassword } from '../validators/password.validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  currentPassword: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @IsStrongPassword()
  newPassword: string;
}
