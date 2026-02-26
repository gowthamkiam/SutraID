import { IsOptional, IsString, IsHexColor, IsUrl, MaxLength } from 'class-validator';

export class CustomizeLoginDto {
  @IsOptional()
  @IsString()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  customCss?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  customHtmlTemplate?: string;
}
