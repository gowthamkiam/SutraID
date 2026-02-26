import { IsString, IsEmail, IsNotEmpty, ValidateNested, IsOptional, IsArray, IsEnum, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationProtocol } from '@prisma/client';

class OrganizationOnboardDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^[a-z0-9-]+$/, {
        message: 'Slug can only contain lowercase letters, numbers, and hyphens',
    })
    slug: string;

    @IsString()
    @IsOptional()
    primaryColor?: string;
}

class ApplicationOnboardDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(ApplicationProtocol)
    type: ApplicationProtocol;

    @IsArray()
    @IsString({ each: true })
    redirectUris: string[];
}

export class OnboardDto {
    @ValidateNested()
    @Type(() => OrganizationOnboardDto)
    organization: OrganizationOnboardDto;

    @ValidateNested()
    @Type(() => ApplicationOnboardDto)
    @IsOptional()
    application?: ApplicationOnboardDto;

    @IsEmail()
    @IsNotEmpty()
    adminEmail: string;
}
