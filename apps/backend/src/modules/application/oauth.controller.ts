import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Headers,
    UnauthorizedException,
    BadRequestException,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('oauth')
export class OauthController {
    constructor(
        private applicationService: ApplicationService,
        private prisma: PrismaService,
    ) { }

    /**
     * Token Endpoint (supports authorization_code, refresh_token, client_credentials)
     */
    @Post('token')
    async token(
        @Body() body: any,
        @Headers('authorization') auth: string,
        @Req() req: any,
    ) {
        // 1. Authenticate Client
        const client = await this.authenticateClient(body, auth);

        // 2. Handle Grant Types
        const grantType = body.grant_type;

        // Placeholder for actual token generation logic
        // This would typically involve checking the code/refresh_token/secret
        // and issuing a JWT bound to DPoP if required.

        const tokenResponse = {
            access_token: 'mock_access_token',
            token_type: client.requireDpop ? 'DPoP' : 'Bearer',
            expires_in: 3600,
            scope: body.scope || 'openid profile email',
        };

        if (client.requireDpop) {
            if (!req.dpopJkt) {
                throw new BadRequestException('DPoP proof required');
            }
            // Bind token to jkt in cnf claim (mocked here)
        }

        return tokenResponse;
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

    private async authenticateClient(body: any, authHeader: string) {
        let clientId = body.client_id;
        let clientSecret = body.client_secret;

        if (authHeader && authHeader.startsWith('Basic ')) {
            const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
            [clientId, clientSecret] = decoded.split(':');
        }

        const application = await this.prisma.application.findUnique({
            where: { clientId },
        });

        if (!application) throw new UnauthorizedException('Invalid client');

        // In production, compare hashed clientSecret

        return application;
    }
}

@Controller('.well-known/openid-configuration')
export class OpenidConfigurationController {
    @Get(':orgId')
    async getConfiguration(@Param('orgId') orgId: string) {
        const baseUrl = `https://api.sutraid.com`; // In prod use dynamic host
        return {
            issuer: `${baseUrl}/${orgId}`,
            authorization_endpoint: `${baseUrl}/oauth/authorize`,
            token_endpoint: `${baseUrl}/oauth/token`,
            jwks_uri: `${baseUrl}/oauth/${orgId}/jwks`,
            response_types_supported: ['code', 'none', 'id_token', 'token', 'id_token token', 'code id_token', 'code token', 'code id_token token'],
            subject_types_supported: ['public'],
            id_token_signing_alg_values_supported: ['RS256'],
            scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
            token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'private_key_jwt'],
            grant_types_supported: ['authorization_code', 'refresh_token', 'client_credentials'],
            dpop_signing_alg_values_supported: ['RS256', 'ES256'],
        };
    }
}
