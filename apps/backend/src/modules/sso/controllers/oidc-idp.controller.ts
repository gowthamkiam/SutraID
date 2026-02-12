import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  BadRequestException,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { OidcIdpService } from '../services/oidc-idp.service';
import { AuthService } from '../../auth/services/auth.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('sso/oidc-idp/:orgId')
export class OidcIdpController {
  constructor(
    private oidcIdpService: OidcIdpService,
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

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
    try {
      const provider = await this.oidcIdpService.getProviderInstance(
        organizationId,
      );

      // Check if user is authenticated
      const user = await this.getCurrentUser(req);

      if (!user) {
        // User not authenticated - redirect to login with returnUrl
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        const returnUrl = encodeURIComponent(req.originalUrl);
        const loginUrl = `${frontendUrl}/login?returnUrl=${returnUrl}`;

        console.log('⚠️  User not authenticated, redirecting to login');
        return res.redirect(loginUrl);
      }

      console.log('✅ User authenticated for OIDC authorization');

      // Forward to oidc-provider
      return provider.app.callback()(req, res);
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

      // Forward to oidc-provider
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

      // Forward to oidc-provider
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

      // Forward to oidc-provider
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
  @UseGuards(JwtAuthGuard)
  async getInteraction(
    @Param('orgId') organizationId: string,
    @Param('uid') uid: string,
    @Req() req: Request,
  ) {
    try {
      const provider = await this.oidcIdpService.getProviderInstance(
        organizationId,
      );

      // oidc-provider requires both req and res for interactionDetails
      // Create a minimal response object for the interaction
      const mockRes: any = {};
      const interaction = await provider.interactionDetails(req, mockRes);

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

      return {
        uid,
        application,
        scopes: interaction.params.scope
          ? (interaction.params.scope as string).split(' ')
          : [],
        redirectUri: interaction.params.redirect_uri,
      };
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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmInteraction(
    @Param('orgId') organizationId: string,
    @Param('uid') uid: string,
    @Body() body: { consent: boolean },
    @Req() req: any,
  ) {
    try {
      const user = req.user;

      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }

      const interaction = await this.oidcIdpService.handleInteraction(
        organizationId,
        uid,
        user.id,
        body.consent,
      );

      console.log(
        `✅ OIDC consent ${body.consent ? 'granted' : 'denied'} by user ${user.id}`,
      );

      return {
        success: true,
        redirectTo: interaction.returnTo,
      };
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

      // Forward all other routes to oidc-provider
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
      // Try to extract JWT from Authorization header or cookie
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
