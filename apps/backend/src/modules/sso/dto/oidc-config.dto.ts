import { IsString, IsBoolean, IsEnum, IsOptional, IsInt, IsArray, Min, Max, Matches } from 'class-validator';
import { ClaimTarget, JwsAlgorithm } from '@prisma/client';

export class CreateOidcScopeDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean = false;
}

export class CreateOidcClaimDto {
    @IsString()
    name: string;

    @IsString()
    userAttribute: string;

    @IsString()
    @IsOptional()
    regexRuleId?: string;

    @IsEnum(ClaimTarget, { each: true })
    @IsArray()
    targetTokens: ClaimTarget[];
}

export class CreateOidcRegexRuleDto {
    @IsString()
    name: string;

    @IsString()
    pattern: string;

    @IsString()
    replacement: string;

    @IsString()
    @IsOptional()
    @Matches(/^[gimsuy]*$/, { message: 'Invalid regex flags' })
    flags?: string = 'g';
}

export class CreateOidcSigningKeyDto {
    @IsString()
    kid: string;

    @IsEnum(JwsAlgorithm)
    algorithm: JwsAlgorithm;

    @IsString()
    publicKey: string;

    @IsString()
    privateKey: string;

    @IsString()
    @IsOptional()
    certChain?: string;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean = false;
}

export class UpdateOidcTokenPolicyDto {
    @IsInt()
    @Min(60)
    @Max(86400 * 365)
    @IsOptional()
    accessTokenLifetime?: number;

    @IsInt()
    @Min(60)
    @Max(86400 * 365)
    @IsOptional()
    idTokenLifetime?: number;

    @IsInt()
    @Min(3600)
    @Max(86400 * 365 * 10)
    @IsOptional()
    refreshTokenLifetime?: number;

    @IsBoolean()
    @IsOptional()
    rotationEnabled?: boolean;

    @IsInt()
    @Min(0)
    @Max(3600)
    @IsOptional()
    reuseInterval?: number;
}
