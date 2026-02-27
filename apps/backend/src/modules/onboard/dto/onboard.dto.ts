import { IsEmail, IsNotEmpty } from 'class-validator';

export class OnboardDto {
    @IsEmail()
    @IsNotEmpty()
    adminEmail: string;
}
