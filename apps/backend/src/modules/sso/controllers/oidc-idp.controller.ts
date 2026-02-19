import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Res,
  BadRequestException,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { OidcIdpService } from '../services/oidc-idp.service';
import { AuthService } from '../../auth/services/auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('sso/oidc-idp/:orgId')
export class OidcIdpController {
  constructor(
    private oidcIdpService: OidcIdpService,
    private authService: AuthService,
    private prisma: PrismaService,
    private config: ConfigService
  ) { }

  private stripPrefix(req: Request, organizationId: string): void {
    const prefix = `/api/v1/sso/oidc-idp/${organizationId}`;
    if (req.url.startsWith(prefix)) {
      req.url = req.url.slice(prefix.length) || '/';
    }
  }

  /**
   * GET /.well-known/openid-configuration
   * OIDC Discovery endpoint
   */
  @Get('.well-known/openid-configuration')
  @HttpCode(HttpStatus.OK)
  async getDiscovery(@Param('orgId') organizationId: string) {
    return this.oidcIdpService.getDiscoveryMetadata(organizationId);
  }

  /**
   * GET /authorize
   * OAuth 2.0 Authorization endpoint
   * Handles authorization requests from external applications
   */
  @Get('authorize')
  async authorize(
    @Param('orgId') organizationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    console.log('📥 OIDC authorization request received');
    try {
      const user = await this.getCurrentUser(req);

       if (!user) {
         // User not authenticated - redirect to login with full returnUrl.
         // FRONTEND_URL / BACKEND_URL may be comma-separated — take the first value.
         const frontendUrl = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001').split(',')[0].trim();
         // Derive backend URL from the incoming request so it always matches
         // the host the caller actually reached (works behind any proxy).
         const proto = req.get('x-forwarded-proto') || req.protocol;
         const backendUrl = `${proto}://${req.get('host')}`;
         const returnUrl = encodeURIComponent(`${backendUrl}${req.originalUrl}`);
         const loginUrl = `${frontendUrl}/login?returnUrl=${returnUrl}`;
 
         console.log('⚠️  User not authenticated, redirecting to login');
         return res.redirect(loginUrl);
       }
 
       console.log('✅ User authenticated for OIDC authorization');

       // Strip auth_token from the URL before forwarding to oidc-provider
       // so it doesn't see unknown query parameters.
       if ((req.query as Record<string, unknown>)?.auth_token) {
         delete (req.query as Record<string, unknown>).auth_token;
         const url = new URL(req.url, `${req.protocol}://${req.get('host')}`);
         url.searchParams.delete('auth_token');
         req.url = url.pathname + url.search;
       }

       // Strip the issuer prefix so oidc-provider's Koa router sees /authorize
       this.stripPrefix(req, organizationId);

       // User is authenticated — let oidc-provider create the interaction
       // then immediately auto-confirm it (skip the consent screen).
       return this.oidcIdpService.handleAuthorizeAsAuthenticated(
         organizationId, user.id, req, res,
       );
    } catch (error: any) {
      console.error('❌ OIDC authorization error:', error);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * POST /token
   * OAuth 2.0 Token endpoint
   * Exchanges authorization code for tokens
   */
  @Post('token')
  @HttpCode(HttpStatus.OK)
  async token(
    @Param('orgId') organizationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const provider = await this.oidcIdpService.getProviderInstance(
        organizationId,
      );

      console.log('📥 OIDC token request received');

      this.stripPrefix(req, organizationId);
      return provider.app.callback()(req, res);
    } catch (error: any) {
      console.error('❌ OIDC token error:', error);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /userinfo
   * OIDC UserInfo endpoint
   * Returns user claims based on access token
   */
  @Get('userinfo')
  @HttpCode(HttpStatus.OK)
  async userinfo(
    @Param('orgId') organizationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const provider = await this.oidcIdpService.getProviderInstance(
        organizationId,
      );

      this.stripPrefix(req, organizationId);
      return provider.app.callback()(req, res);
    } catch (error: any) {
      console.error('❌ OIDC userinfo error:', error);
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * GET /jwks
   * JSON Web Key Set endpoint
   * Provides public keys for token verification
   */
  @Get('jwks')
  @HttpCode(HttpStatus.OK)
  async jwks(
    @Param('orgId') organizationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const provider = await this.oidcIdpService.getProviderInstance(
        organizationId,
      );

      this.stripPrefix(req, organizationId);
      return provider.app.callback()(req, res);
    } catch (error: any) {
      console.error('❌ OIDC jwks error:', error);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /interaction/:uid
   * Get interaction details for consent screen
   */
  @Get('interaction/:uid')
  async getInteraction(
    @Param('orgId') organizationId: string,
    @Param('uid') uid: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Verify caller is authenticated via Bearer token
      const user = await this.getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const provider = await this.oidcIdpService.getProviderInstance(
        organizationId,
      );

      const interaction = await provider.interactionDetails(req, res);

      // Get application details
      const application = await this.prisma.application.findFirst({
        where: {
          organizationId,
          clientId: interaction.params.client_id as string,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          description: true,
          logoUrl: true,
        },
      });

      if (!application) {
        throw new BadRequestException('Application not found');
      }

      return res.json({
        uid,
        application,
        scopes: interaction.params.scope
          ? (interaction.params.scope as string).split(' ')
          : [],
        redirectUri: interaction.params.redirect_uri,
      });
    } catch (error: any) {
      console.error('❌ OIDC interaction error:', error);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * POST /interaction/:uid/confirm
   * Confirm or deny consent
   */
  @Post('interaction/:uid/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmInteraction(
    @Param('orgId') organizationId: string,
    @Param('uid') uid: string,
    @Body() body: { consent: boolean },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const user = await this.getCurrentUser(req);

      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }

      const redirectTo = await this.oidcIdpService.handleInteraction(
        organizationId,
        uid,
        user.id,
        body.consent,
        req,
        res,
      );

      console.log(
        `✅ OIDC consent ${body.consent ? 'granted' : 'denied'} by user ${user.id}`,
      );

      return res.json({
        success: true,
        redirectTo,
      });
    } catch (error: any) {
      console.error('❌ OIDC consent error:', error);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * ALL /callback
   * Callback endpoint (catch-all for oidc-provider internal routes)
   */
  @Get('*')
  @Post('*')
  async callback(
    @Param('orgId') organizationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const provider = await this.oidcIdpService.getProviderInstance(
        organizationId,
      );

      this.stripPrefix(req, organizationId);
      return provider.app.callback()(req, res);
    } catch (error: any) {
      console.error('❌ OIDC callback error:', error);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Get current authenticated user from request
   */
  private async getCurrentUser(req: Request): Promise<any | null> {
    try {
      // Try to extract JWT from Authorization header, cookie, or query param.
      // The query-param path is used when the frontend redirects back after
      // login — browser navigations can't carry Authorization headers.
      const authHeader = req.headers.authorization;
      const queryToken = (req.query as Record<string, unknown>)?.auth_token as string | undefined;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : req.cookies?.access_token || queryToken;

      if (!token) {
        return null;
      }

      // Verify the token and get user
      const payload = await this.authService.verifyAccessToken(token);
      if (!payload || !payload.sub) {
        return null;
      }

      // Get user from database
      const user = await this.authService.getUserById(payload.sub);
      return user;
    } catch (error) {
      return null;
    }
  }

}
