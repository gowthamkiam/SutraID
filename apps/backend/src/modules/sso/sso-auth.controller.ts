import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  Req,
  Session,
  BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { SamlSpService } from './services/saml-sp.service';
import { OidcClientService } from './services/oidc-client.service';
import { SsoService } from './sso.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('sso')
export class SsoAuthController {
  constructor(
    private readonly samlSpService: SamlSpService,
    private readonly oidcClientService: OidcClientService,
    private readonly ssoService: SsoService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Discover SSO providers by email domain (public endpoint for login page)
   */
  @Get('discover')
  async discover(@Query('domain') domain: string) {
    if (!domain) {
      throw new BadRequestException('domain query parameter is required');
    }

    const providers = await this.ssoService.discoverByDomain(domain);
    return { providers };
  }

  // ============================================================================
  // SAML Service Provider Endpoints
  // ============================================================================

  /**
   * Initiate SAML login
   */
  @Get('saml/:orgId/login')
  async samlLogin(
    @Param('orgId') orgId: string,
    @Query('providerId') providerId: string,
    @Res() res: Response,
  ) {
    if (!providerId) {
      throw new BadRequestException('providerId is required');
    }

    try {
      const loginUrl = await this.samlSpService.getLoginUrl(
        providerId,
        orgId, // Use orgId as relay state
      );

      res.redirect(loginUrl);
    } catch (error: any) {
      throw new BadRequestException(`SAML login failed: ${error.message}`);
    }
  }

  /**
   * SAML Assertion Consumer Service (ACS)
   */
  @Post('saml/:orgId/acs')
  async samlAcs(
    @Param('orgId') orgId: string,
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Extract providerId from RelayState or find by orgId
      const relayState = body.RelayState || orgId;

      // Find provider by organization
      const providers = await this.prisma.ssoProvider.findMany({
        where: {
          organizationId: orgId,
          protocol: 'SAML2',
          enabled: true,
        },
      });

      if (providers.length === 0) {
        throw new BadRequestException('No enabled SAML provider found');
      }

      const providerId = providers[0].id;

      // Validate SAML response
      const profile = await this.samlSpService.validateSamlResponse(
        providerId,
        body,
      );

      // Get or create user
      const user = await this.samlSpService.getOrCreateSsoIdentity(
        providerId,
        profile.externalId,
        profile.email,
        profile.attributes,
      );

      // TODO: Create session and JWT tokens
      // For now, redirect with user info
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3001').split(',')[0].trim();
      res.redirect(
        `${frontendUrl}/auth/callback?userId=${user.id}&email=${user.email}`,
      );
    } catch (error: any) {
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3001').split(',')[0].trim();
      res.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`,
      );
    }
  }

  /**
   * Get SAML metadata
   */
  @Get('saml/:orgId/metadata')
  async samlMetadata(@Param('orgId') orgId: string, @Res() res: Response) {
    const metadata = await this.samlSpService.getMetadata(orgId);

    res.type('application/xml');
    res.send(metadata);
  }

  // ============================================================================
  // OIDC Service Provider Endpoints
  // ============================================================================

  /**
   * Initiate OIDC login
   */
  @Get('oidc/:providerId/login')
  async oidcLogin(
    @Param('providerId') providerId: string,
    @Session() session: any,
    @Res() res: Response,
  ) {
    try {
      const { url, codeVerifier, nonce } =
        await this.oidcClientService.getAuthorizationUrl(providerId);

      // Store PKCE code_verifier and nonce in session
      session.oidc = {
        providerId,
        codeVerifier,
        nonce,
      };

      res.redirect(url);
    } catch (error: any) {
      throw new BadRequestException(`OIDC login failed: ${error.message}`);
    }
  }

  /**
   * OIDC callback (handle authorization code)
   */
  @Get('oidc/:providerId/callback')
  async oidcCallback(
    @Param('providerId') providerId: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Session() session: any,
    @Res() res: Response,
  ) {
    try {
      if (!code) {
        throw new BadRequestException('Authorization code is missing');
      }

      // Retrieve PKCE code_verifier and nonce from session
      const { codeVerifier, nonce } = session.oidc || {};

      if (!codeVerifier || !nonce) {
        throw new BadRequestException('Session expired or invalid');
      }

      // Exchange code for tokens and get user profile
      const profile = await this.oidcClientService.handleCallback(
        providerId,
        code,
        codeVerifier,
        nonce,
      );

      // Get or create user
      const user = await this.oidcClientService.getOrCreateSsoIdentity(
        providerId,
        profile.externalId,
        profile.email,
        profile.attributes,
      );

      // Clear OIDC session data
      delete session.oidc;

      // TODO: Create session and JWT tokens
      // For now, redirect with user info
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3001').split(',')[0].trim();
      res.redirect(
        `${frontendUrl}/auth/callback?userId=${user.id}&email=${user.email}`,
      );
    } catch (error: any) {
      const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3001').split(',')[0].trim();
      res.redirect(
        `${frontendUrl}/auth/error?message=${encodeURIComponent(error.message)}`,
      );
    }
  }
}
