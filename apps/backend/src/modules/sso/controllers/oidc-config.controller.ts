import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OidcConfigService } from '../services/oidc-config.service';
import {
    CreateOidcScopeDto,
    CreateOidcClaimDto,
    CreateOidcRegexRuleDto,
    CreateOidcSigningKeyDto,
    UpdateOidcTokenPolicyDto,
} from '../dto/oidc-config.dto';

@Controller('applications/:appId/oidc-config')
@UseGuards(JwtAuthGuard)
export class OidcConfigController {
    constructor(private readonly oidcConfigService: OidcConfigService) { }

    @Get()
    async getConfig(@Param('appId') applicationId: string) {
        return this.oidcConfigService.getConfig(applicationId);
    }

    // Scopes
    @Post('scopes')
    async createScope(
        @Param('appId') applicationId: string,
        @Body() dto: CreateOidcScopeDto,
    ) {
        return this.oidcConfigService.createScope(applicationId, dto);
    }

    @Get('scopes')
    async getScopes(@Param('appId') applicationId: string) {
        return this.oidcConfigService.getScopes(applicationId);
    }

    // Claims
    @Post('claims')
    async createClaim(
        @Param('appId') applicationId: string,
        @Body() dto: CreateOidcClaimDto,
    ) {
        return this.oidcConfigService.createClaim(applicationId, dto);
    }

    @Get('claims')
    async getClaims(@Param('appId') applicationId: string) {
        return this.oidcConfigService.getClaims(applicationId);
    }

    // Regex Rules
    @Post('regex-rules')
    async createRegexRule(
        @Param('appId') applicationId: string,
        @Body() dto: CreateOidcRegexRuleDto,
    ) {
        return this.oidcConfigService.createRegexRule(applicationId, dto);
    }

    @Get('regex-rules')
    async getRegexRules(@Param('appId') applicationId: string) {
        return this.oidcConfigService.getRegexRules(applicationId);
    }

    // Signing Keys
    @Post('signing-keys')
    async createSigningKey(
        @Param('appId') applicationId: string,
        @Body() dto: CreateOidcSigningKeyDto,
    ) {
        return this.oidcConfigService.createSigningKey(applicationId, dto);
    }

    @Get('signing-keys')
    async getSigningKeys(@Param('appId') applicationId: string) {
        return this.oidcConfigService.getSigningKeys(applicationId);
    }

    // Token Policy
    @Put('token-policy')
    async updateTokenPolicy(
        @Param('appId') applicationId: string,
        @Body() dto: UpdateOidcTokenPolicyDto,
    ) {
        return this.oidcConfigService.updateTokenPolicy(applicationId, dto);
    }

    @Get('token-policy')
    async getTokenPolicy(@Param('appId') applicationId: string) {
        return this.oidcConfigService.getTokenPolicy(applicationId);
    }
}
