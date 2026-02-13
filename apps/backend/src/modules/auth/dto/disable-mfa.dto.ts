import { IsString, IsNotEmpty } from 'class-validator';

export class DisableMfaDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}
