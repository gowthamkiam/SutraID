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
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('sso/oidc-idp/:appId')
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
    @Param('appId') applicationId: string,
  ) {
    return this.oidcIdpService.getDiscoveryMetadata(applicationId);
  }

  /**
   * GET /authorize
   * OAuth 2.0 Authorization endpoint
   */
  @Get('authorize')
  async authorize(
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

      const authorized = await this.isUserAuthorizedForApp(user.id, applicationId);
      if (!authorized) {
        console.log(`⛔ User ${user.id} not authorized for application ${applicationId}`);
        const redirectUri = req.query.redirect_uri as string;
        const state = req.query.state as string;
        if (redirectUri) {
          const url = new URL(redirectUri);
          url.searchParams.set('error', 'access_denied');
          url.searchParams.set('error_description', 'User is not authorized for this application');
          if (state) url.searchParams.set('state', state);
          res.redirect(url.toString());
          return;
        }
        throw new BadRequestException('User is not authorized for this application');
      }

      console.log('✅ User authenticated, forwarding to oidc-provider');
      await this.oidcIdpService.dispatchToProvider(applicationId, req, res);
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

      const authorized = await this.isUserAuthorizedForApp(user.id, applicationId);
      if (!authorized) {
        console.log(`⛔ User ${user.id} not authorized for application ${applicationId}`);
        const returnTo = await this.oidcIdpService.handleInteraction(
          applicationId, uid, user.id, false, req, res,
        );
        res.redirect(returnTo);
        return;
      }

      const returnTo = await this.oidcIdpService.handleInteraction(
        applicationId, uid, user.id, true, req, res,
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
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      console.log('📥 OIDC token request received');
      await this.oidcIdpService.dispatchToProvider(applicationId, req, res);
    } catch (error: any) {
      console.error('❌ OIDC token error:', error);
      throw new BadRequestException(error.message);
    }
  }

  @Get('userinfo')
  @HttpCode(HttpStatus.OK)
  async userinfo(
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.oidcIdpService.dispatchToProvider(applicationId, req, res);
    } catch (error: any) {
      throw new UnauthorizedException(error.message);
    }
  }

  @Post('userinfo')
  @HttpCode(HttpStatus.OK)
  async userinfoPost(
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.oidcIdpService.dispatchToProvider(applicationId, req, res);
    } catch (error: any) {
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
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.oidcIdpService.dispatchToProvider(applicationId, req, res);
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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmInteraction(
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

      let consent = body.consent;
      if (consent) {
        const authorized = await this.isUserAuthorizedForApp(user.id, applicationId);
        if (!authorized) {
          console.log(`⛔ User ${user.id} not authorized for application ${applicationId}`);
          consent = false;
        }
      }

      const redirectTo = await this.oidcIdpService.handleInteraction(
        applicationId,
        uid,
        user.id,
        consent,
        req,
        res,
      );

      console.log(
        `✅ OIDC consent ${consent ? 'granted' : 'denied'} by user ${user.id}`,
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
   * POST /introspect
   * Token Introspection endpoint (RFC 7662)
   * Proxies to oidc-provider's /token/introspection
   */
  @Post('introspect')
  @HttpCode(HttpStatus.OK)
  async introspect(
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // oidc-provider registers introspection at /token/introspection
      const originalUrl = req.url;
      req.url = '/token/introspection';
      const provider = await this.oidcIdpService.getProviderInstance(applicationId);
      await (provider.app.callback())(req, res);
      req.url = originalUrl;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('end-session')
  async endSessionGet(
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.oidcIdpService.dispatchToProvider(applicationId, req, res);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('end-session')
  async endSessionPost(
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.oidcIdpService.dispatchToProvider(applicationId, req, res);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('*')
  @Post('*')
  async callback(
    @Param('appId') applicationId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.oidcIdpService.dispatchToProvider(applicationId, req, res);
    } catch (error: any) {
      console.error('❌ OIDC callback error:', error);
      throw new BadRequestException(error.message);
    }
  }

  private async isUserAuthorizedForApp(userId: string, applicationId: string): Promise<boolean> {
    const directAssignment = await this.prisma.userApplicationAssignment.findUnique({
      where: { userId_applicationId: { userId, applicationId } },
    });
    if (directAssignment) return true;

    const groupAssignment = await this.prisma.groupApplicationAssignment.findFirst({
      where: {
        applicationId,
        group: { members: { some: { userId } } },
      },
    });
    return !!groupAssignment;
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
