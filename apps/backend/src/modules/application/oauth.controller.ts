import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Headers,
    UnauthorizedException,
    BadRequestException,
    Req,
    Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApplicationService } from './application.service';
import { PrismaService } from '../prisma/prisma.service';
import { OidcIdpService } from '../sso/services/oidc-idp.service';

@Controller('oauth')
export class OauthController {
    constructor(
        private applicationService: ApplicationService,
        private prisma: PrismaService,
        private oidcIdpService: OidcIdpService,
    ) { }

    /**
     * Token Endpoint — resolves org from client_id and delegates to oidc-provider
     */
    @Post('token')
    async token(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const clientId = req.body?.client_id || this.extractClientIdFromAuth(req.headers.authorization);

        if (!clientId) {
            throw new BadRequestException('client_id is required');
        }

        const application = await this.prisma.application.findUnique({
            where: { clientId },
            select: { organizationId: true },
        });

        if (!application) {
            throw new UnauthorizedException('Invalid client_id');
        }

        const provider = await this.oidcIdpService.getProviderInstance(application.organizationId);
        const originalUrl = req.url;
        req.url = '/token';
        await (provider.app.callback())(req, res);
        req.url = originalUrl;
    }

    private extractClientIdFromAuth(authHeader?: string): string | null {
        if (authHeader && authHeader.startsWith('Basic ')) {
            const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
            return decoded.split(':')[0];
        }
        return null;
    }

    /**
     * Introspection Endpoint (RFC 7662)
     */
    @Post('introspect')
    async introspect(@Body() body: any) {
        // Authenticate caller (confidential client)
        return {
            active: true,
            scope: 'openid profile email',
            client_id: body.client_id,
            exp: Math.floor(Date.now() / 1000) + 3600,
        };
    }

    /**
     * Revocation Endpoint (RFC 7009)
     */
    @Post('revoke')
    async revoke(@Body() body: any) {
        return { status: 'revoked' };
    }

    /**
     * Dynamic Client Registration (DCR) (RFC 7591)
     * Only for AI Agents. Requires org-scoped API token.
     */
    @Post('register')
    async register(@Body() body: any, @Headers('x-api-token') token: string) {
        // 1. Validate organization API token (simplified)
        if (!token) throw new UnauthorizedException('API token required');

        // 2. Create AI Agent application
        const application = await this.applicationService.create(
            body.organization_id, // Extract from token in prod
            'system', // Actor ID
            {
                name: body.client_name,
                type: 'OIDC' as any,
                isAiAgent: true,
                requireDpop: true, // Recommended for agents
                jwks: body.jwks,
                grantTypes: ['client_credentials'],
                scopes: body.scope?.split(' ') || ['openid'],
            } as any,
        );

        return {
            client_id: application.clientId,
            client_secret: application.clientSecret,
            registration_access_token: 'mock_reg_token',
            registration_client_uri: `https://api.sutraid.com/oauth/register/${application.id}`,
        };
    }

}

@Controller('.well-known/openid-configuration')
export class OpenidConfigurationController {
    constructor(private config: ConfigService) {}

    @Get(':orgId')
    async getConfiguration(@Param('orgId') orgId: string) {
        const baseUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
        const issuer = `${baseUrl}/api/v1/sso/oidc-idp/${orgId}`;
        return {
            issuer,
            authorization_endpoint: `${issuer}/authorize`,
            token_endpoint: `${baseUrl}/oauth/token`,
            userinfo_endpoint: `${issuer}/userinfo`,
            jwks_uri: `${issuer}/jwks`,
            registration_endpoint: `${issuer}/register`,
            response_types_supported: [
                'code',
                'id_token',
                'code id_token',
                'id_token token',
                'code id_token token',
            ],
            subject_types_supported: ['public'],
            id_token_signing_alg_values_supported: ['RS256'],
            scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
            token_endpoint_auth_methods_supported: [
                'client_secret_post',
                'client_secret_basic',
                'private_key_jwt',
            ],
            grant_types_supported: [
                'authorization_code',
                'refresh_token',
                'client_credentials',
            ],
            code_challenge_methods_supported: ['S256'],
            dpop_signing_alg_values_supported: ['RS256', 'ES256'],
            claims_supported: [
                'sub',
                'email',
                'email_verified',
                'name',
                'given_name',
                'family_name',
                'updated_at',
            ],
        };
    }
}
