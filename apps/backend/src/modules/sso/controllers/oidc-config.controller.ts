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

@Controller('orgs/:orgId')
@UseGuards(JwtAuthGuard)
export class OidcConfigController {
    constructor(private readonly oidcConfigService: OidcConfigService) { }

    @Get('config')
    async getConfig(@Param('orgId') organizationId: string) {
        return this.oidcConfigService.getConfig(organizationId);
    }

    // Scopes
    @Post('scopes')
    async createScope(
        @Param('orgId') organizationId: string,
        @Body() dto: CreateOidcScopeDto,
    ) {
        return this.oidcConfigService.createScope(organizationId, dto);
    }

    @Get('scopes')
    async getScopes(@Param('orgId') organizationId: string) {
        return this.oidcConfigService.getScopes(organizationId);
    }

    // Claims
    @Post('claims')
    async createClaim(
        @Param('orgId') organizationId: string,
        @Body() dto: CreateOidcClaimDto,
    ) {
        return this.oidcConfigService.createClaim(organizationId, dto);
    }

    @Get('claims')
    async getClaims(@Param('orgId') organizationId: string) {
        return this.oidcConfigService.getClaims(organizationId);
    }

    // Regex Rules
    @Post('regex-rules')
    async createRegexRule(
        @Param('orgId') organizationId: string,
        @Body() dto: CreateOidcRegexRuleDto,
    ) {
        return this.oidcConfigService.createRegexRule(organizationId, dto);
    }

    @Get('regex-rules')
    async getRegexRules(@Param('orgId') organizationId: string) {
        return this.oidcConfigService.getRegexRules(organizationId);
    }

    // Signing Keys
    @Post('signing-keys')
    async createSigningKey(
        @Param('orgId') organizationId: string,
        @Body() dto: CreateOidcSigningKeyDto,
    ) {
        return this.oidcConfigService.createSigningKey(organizationId, dto);
    }

    @Get('signing-keys')
    async getSigningKeys(@Param('orgId') organizationId: string) {
        return this.oidcConfigService.getSigningKeys(organizationId);
    }

    // Token Policy
    @Put('token-policy')
    async updateTokenPolicy(
        @Param('orgId') organizationId: string,
        @Body() dto: UpdateOidcTokenPolicyDto,
    ) {
        return this.oidcConfigService.updateTokenPolicy(organizationId, dto);
    }

    @Get('token-policy')
    async getTokenPolicy(@Param('orgId') organizationId: string) {
        return this.oidcConfigService.getTokenPolicy(organizationId);
    }
}
