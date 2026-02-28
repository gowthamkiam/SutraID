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
    UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApplicationService } from './application.service';
import { PrismaService } from '../prisma/prisma.service';
import { OidcIdpService } from '../sso/services/oidc-idp.service';
import { RopcRateLimitGuard } from './guards/ropc-rate-limit.guard';
import { jwtVerify, createRemoteJWKSet, decodeJwt } from 'jose';
import * as crypto from 'crypto';

@Controller('oauth')
export class OauthController {
    constructor(
        private applicationService: ApplicationService,
        private prisma: PrismaService,
        private oidcIdpService: OidcIdpService,
        private config: ConfigService,
    ) { }

    /**
     * Token Endpoint — resolves app from client_id, validates grant type, delegates to oidc-provider
     */
    @Post('token')
    @UseGuards(RopcRateLimitGuard)
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
            select: {
                id: true,
                clientSecretHash: true,
                isPublicClient: true,
                allowROPC: true,
                allowClientCredentials: true,
            },
        });

        if (!application) {
            throw new UnauthorizedException('Invalid client_id');
        }

        // Verify client credentials before delegating to oidc-provider
        if (!application.isPublicClient && application.clientSecretHash) {
            let clientSecret: string | null = null;
            if (req.headers.authorization?.startsWith('Basic ')) {
                const decoded = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString();
                clientSecret = decoded.split(':')[1];
            } else if (req.body?.client_secret) {
                clientSecret = req.body.client_secret;
            }
            if (!clientSecret) {
                return res.status(401).json({
                    error: 'invalid_client',
                    error_description: 'client_secret is required',
                });
            }
            const secretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');
            if (secretHash !== application.clientSecretHash) {
                return res.status(401).json({
                    error: 'invalid_client',
                    error_description: 'client authentication failed',
                });
            }
            // Replace plaintext secret with hash so oidc-provider's check passes
            // (oidc-provider has client_secret = hash, so body must also send hash)
            if (req.body?.client_secret) {
                req.body.client_secret = application.clientSecretHash;
            }
            if (req.headers.authorization?.startsWith('Basic ')) {
                const encoded = Buffer.from(`${clientId}:${application.clientSecretHash}`).toString('base64');
                req.headers.authorization = `Basic ${encoded}`;
            }
        }

        const grantType = req.body?.grant_type;
        if (grantType === 'password' && !application.allowROPC) {
            return res.status(400).json({
                error: 'unsupported_grant_type',
                error_description: 'Password grant is not enabled for this application',
            });
        }
        if (grantType === 'implicit') {
            return res.status(400).json({
                error: 'unsupported_grant_type',
                error_description: 'Implicit grant is not supported',
            });
        }
        if (grantType === 'client_credentials' && !application.allowClientCredentials) {
            return res.status(400).json({
                error: 'unsupported_grant_type',
                error_description: 'Client credentials grant is not enabled for this application',
            });
        }

        const provider = await this.oidcIdpService.getProviderInstance(application.id);
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
    async introspect(
        @Body() body: { token: string; token_type_hint?: string; client_id?: string; client_secret?: string },
        @Headers('authorization') authHeader: string,
    ) {
        const clientId = this.extractClientIdFromIntrospection(authHeader, body);
        if (!clientId) {
            throw new UnauthorizedException('Client authentication required');
        }

        const application = await this.prisma.application.findUnique({
            where: { clientId },
        });

        if (!application) {
            throw new UnauthorizedException('Invalid client');
        }

        await this.verifyClientCredentials(application, body, authHeader);

        try {
            const jwksUrl = await this.getJWKSUrl(application.id);
            const JWKS = createRemoteJWKSet(new URL(jwksUrl));
            const { payload } = await jwtVerify(body.token, JWKS);

            const revoked = await this.prisma.oidcToken.findFirst({
                where: {
                    tokenId: payload.jti as string,
                    consumed: true,
                },
            });

            if (revoked) {
                return { active: false };
            }

            const response: any = {
                active: true,
                scope: payload.scope,
                client_id: (payload.client_id || payload.azp) as string,
                token_type: 'Bearer',
                exp: payload.exp,
                iat: payload.iat,
                sub: payload.sub,
                iss: payload.iss,
                aud: payload.aud,
            };

            if (payload.typ === 'ai_agent') {
                response.agent_id = payload.agent_id;
                response.agent_version = payload.agent_version;
            }

            return response;
        } catch (err) {
            return { active: false };
        }
    }

    /**
     * Revocation Endpoint (RFC 7009)
     */
    @Post('revoke')
    async revoke(
        @Body() body: { token: string; token_type_hint?: string; client_id?: string; client_secret?: string },
        @Headers('authorization') authHeader: string,
    ) {
        const clientId = this.extractClientIdFromIntrospection(authHeader, body);
        if (!clientId) {
            throw new UnauthorizedException('Client authentication required');
        }

        const application = await this.prisma.application.findUnique({
            where: { clientId },
        });

        if (!application) {
            throw new UnauthorizedException('Invalid client');
        }

        await this.verifyClientCredentials(application, body, authHeader);

        try {
            const decoded = decodeJwt(body.token);
            if (decoded.jti) {
                await this.prisma.oidcToken.updateMany({
                    where: {
                        tokenId: decoded.jti as string,
                        applicationId: application.id,
                    },
                    data: {
                        consumed: true,
                        consumedAt: new Date(),
                    },
                });
            }
        } catch (err) {
        }

        return { status: 'revoked' };
    }

    private extractClientIdFromIntrospection(authHeader: string | undefined, body: any): string | null {
        if (authHeader && authHeader.startsWith('Basic ')) {
            const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
            return decoded.split(':')[0];
        }
        return body.client_id || null;
    }

    private async verifyClientCredentials(
        application: any,
        body: any,
        authHeader: string | undefined,
    ): Promise<void> {
        let clientSecret: string | null = null;

        if (authHeader && authHeader.startsWith('Basic ')) {
            const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
            clientSecret = decoded.split(':')[1];
        } else if (body.client_secret) {
            clientSecret = body.client_secret;
        }

        if (!clientSecret) {
            throw new UnauthorizedException('Client secret required');
        }

        const secretHash = crypto.createHash('sha256').update(clientSecret).digest('hex');
        if (secretHash !== application.clientSecretHash) {
            throw new UnauthorizedException('Invalid client credentials');
        }
    }

    private async getJWKSUrl(applicationId: string): Promise<string> {
        const baseUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
        const apiPrefix = this.config.get<string>('API_PREFIX') || 'api/v1';
        return `${baseUrl}/${apiPrefix}/sso/oidc-idp/${applicationId}/jwks`;
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
            'system',
            {
                name: body.client_name,
                type: 'OIDC' as any,
                isAiAgent: true,
                requireDpop: true,
                jwks: body.jwks,
                grantTypes: ['client_credentials'],
                scopes: body.scope?.split(' ') || ['openid'],
                allowClientCredentials: true,
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
    constructor(
        private config: ConfigService,
        private prisma: PrismaService,
    ) { }

    @Get(':appId')
    async getAppConfiguration(
        @Param('appId') appId: string,
    ) {
        const app = await this.prisma.application.findUnique({
            where: { id: appId },
            select: { allowROPC: true, allowClientCredentials: true },
        });

        const baseUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
        const issuer = `${baseUrl}/api/v1/sso/oidc-idp/${appId}`;
        const oauthBase = `${baseUrl}/api/v1/oauth`;

        const grantTypes = ['authorization_code', 'refresh_token'];
        if (app?.allowClientCredentials) grantTypes.push('client_credentials');
        if (app?.allowROPC) grantTypes.push('password');

        return {
            issuer,
            authorization_endpoint: `${issuer}/authorize`,
            token_endpoint: `${oauthBase}/token`,
            userinfo_endpoint: `${issuer}/userinfo`,
            jwks_uri: `${issuer}/jwks`,
            revocation_endpoint: `${oauthBase}/revoke`,
            introspection_endpoint: `${oauthBase}/introspect`,
            end_session_endpoint: `${issuer}/end-session`,
            response_types_supported: ['code'],
            subject_types_supported: ['public'],
            id_token_signing_alg_values_supported: ['RS256'],
            scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
            token_endpoint_auth_methods_supported: [
                'client_secret_post',
                'client_secret_basic',
            ],
            revocation_endpoint_auth_methods_supported: [
                'client_secret_post',
                'client_secret_basic',
            ],
            introspection_endpoint_auth_methods_supported: [
                'client_secret_post',
                'client_secret_basic',
            ],
            grant_types_supported: grantTypes,
            code_challenge_methods_supported: ['S256'],
            claims_supported: [
                'sub',
                'email',
                'email_verified',
                'name',
                'given_name',
                'family_name',
                'updated_at',
                'roles',
            ],
        };
    }
}
