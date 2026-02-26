import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { IsStrongPassword } from '../validators/password.validator';

export class RegisterPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @IsStrongPassword()
  password: string;
}
