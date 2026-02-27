import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}
