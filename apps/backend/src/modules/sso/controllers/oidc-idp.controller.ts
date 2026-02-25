import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { OidcIdpService } from '../services/oidc-idp.service';
import { AuthService } from '../../auth/services/auth.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../../auth/guards/org.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('sso/oidc-idp/:orgId/:appId')
export class OidcIdpController {
  constructor(
    private oidcIdpService: OidcIdpService,
    private authService: AuthService,
    private prisma: PrismaService,
    private config: ConfigService
  ) { }

  /**
   * GET /.well-known/openid-configuration
   * OIDC Discovery endpoint
   */
  @Get('.well-known/openid-configuration')
  @HttpCode(HttpStatus.OK)
  async getDiscovery(
    @Param('orgId') organizationId: string,
    @Param('appId') applicationId: string,
  ) {
    return this.oidcIdpService.getDiscoveryMetadata(organizationId, applicationId);
  }

  /**
   * GET /authorize
   * OAuth 2.0 Authorization endpoint
   */
  @Get('authorize')
  async authorize(
    @Param('orgId') organizationId: string,
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    console.log('📥 OIDC authorization request received');
    try {
      const user = await this.getCurrentUser(req);

      if (!user) {
        const frontendUrl = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001').split(',')[0].trim();
        const proto = req.get('x-forwarded-proto') || req.protocol;
        const backendUrl = `${proto}://${req.get('host')}`;
        const returnUrl = encodeURIComponent(`${backendUrl}${req.originalUrl}`);
        console.log('⚠️  User not authenticated, redirecting to login');
        res.redirect(`${frontendUrl}/login?returnUrl=${returnUrl}`);
        return;
      }

      console.log('✅ User authenticated, forwarding to oidc-provider');
      await this.oidcIdpService.dispatchToProvider(organizationId, applicationId, req, res);
    } catch (error: any) {
      console.error('❌ OIDC authorization error:', error);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /auto-confirm
   * Backend interaction endpoint — auto-confirms consent for authenticated users.
   * oidc-provider redirects here so signed interaction cookies arrive naturally.
   */
  @Get('auto-confirm')
  async autoConfirm(
    @Param('orgId') organizationId: string,
    @Param('appId') applicationId: string,
    @Query('uid') uid: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    console.log('📥 OIDC auto-confirm interaction request');
    try {
      const user = await this.getCurrentUser(req);

      if (!user) {
        const frontendUrl = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001').split(',')[0].trim();
        res.redirect(`${frontendUrl}/login`);
        return;
      }

      const returnTo = await this.oidcIdpService.handleInteraction(
        organizationId, applicationId, uid, user.id, true, req, res,
      );

      console.log(`✅ Interaction auto-confirmed, resuming at ${returnTo}`);
      res.redirect(returnTo);
    } catch (error: any) {
      console.error('❌ OIDC auto-confirm error:', error);
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
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      console.log('📥 OIDC token request received');
      await this.oidcIdpService.dispatchToProvider(organizationId, applicationId, req, res);
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
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.oidcIdpService.dispatchToProvider(organizationId, applicationId, req, res);
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
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.oidcIdpService.dispatchToProvider(organizationId, applicationId, req, res);
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
  @UseGuards(JwtAuthGuard, OrgGuard)
  async getInteraction(
    @Param('orgId') organizationId: string,
    @Param('appId') applicationId: string,
    @Param('uid') uid: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Verify caller is authenticated via Bearer token
      const user = await this.getCurrentUser(req);
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const provider = await this.oidcIdpService.getProviderInstance(
        applicationId,
      );

      const interaction = await provider.interactionDetails(req, res);

      // Get application details
      const application = await this.prisma.application.findFirst({
        where: {
          id: applicationId,
          organizationId,
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

      res.json({
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
  @UseGuards(JwtAuthGuard, OrgGuard)
  @HttpCode(HttpStatus.OK)
  async confirmInteraction(
    @Param('orgId') organizationId: string,
    @Param('appId') applicationId: string,
    @Param('uid') uid: string,
    @Body() body: { consent: boolean },
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const user = await this.getCurrentUser(req);

      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }

      const redirectTo = await this.oidcIdpService.handleInteraction(
        organizationId,
        applicationId,
        uid,
        user.id,
        body.consent,
        req,
        res,
      );

      console.log(
        `✅ OIDC consent ${body.consent ? 'granted' : 'denied'} by user ${user.id}`,
      );

      res.json({
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
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.oidcIdpService.dispatchToProvider(organizationId, applicationId, req, res);
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
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : req.cookies?.access_token;

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
