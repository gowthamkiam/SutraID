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
import { SamlIdpService } from '../services/saml-idp.service';
import { AuthService } from '../../auth/services/auth.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('sso/saml-idp/:orgId')
export class SamlIdpController {
  constructor(
    private samlIdpService: SamlIdpService,
    private authService: AuthService,
  ) {}

  /**
   * GET /api/v1/sso/saml-idp/:orgId/metadata
   * Provides SAML IDP metadata XML for configuration in external SPs
   */
  @Get('metadata')
  @HttpCode(HttpStatus.OK)
  async getMetadata(
    @Param('orgId') organizationId: string,
    @Res() res: Response,
  ) {
    try {
      const metadata = await this.samlIdpService.getIdpMetadata(organizationId);

      // Return XML with correct content type
      res.set('Content-Type', 'application/samlmetadata+xml');
      return res.send(metadata);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * GET /api/v1/sso/saml-idp/:orgId/sso
   * Handle SAML AuthnRequest via HTTP-Redirect binding
   */
  @Get('sso')
  async handleSsoGet(
    @Param('orgId') organizationId: string,
    @Query('SAMLRequest') samlRequest: string,
    @Query('RelayState') relayState: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!samlRequest) {
      throw new BadRequestException('SAMLRequest parameter is required');
    }

    try {
      // Parse the SAML AuthnRequest
      const authnRequest = await this.samlIdpService.parseAuthnRequest(
        organizationId,
        samlRequest,
      );

      console.log('📥 SAML AuthnRequest received:', {
        organizationId,
        requestId: authnRequest.id,
        issuer: authnRequest.issuer,
        acsUrl: authnRequest.acsUrl,
        relayState,
      });

      // Check if user is authenticated
      const user = await this.getCurrentUser(req);

      if (!user) {
        // User not authenticated - redirect to login page
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3001').split(',')[0].trim();
        const proto = req.get('x-forwarded-proto') || req.protocol;
        const backendUrl = `${proto}://${req.get('host')}`;
        const returnUrl = encodeURIComponent(`${backendUrl}${req.originalUrl}`);
        const loginUrl = `${frontendUrl}/login?returnUrl=${returnUrl}`;

        console.log('⚠️  User not authenticated, redirecting to login');
        return res.redirect(loginUrl);
      }

      // Verify user has access to this application
      const hasAccess = await this.samlIdpService.verifyUserAccess(
        user,
        organizationId,
        authnRequest.issuer,
      );

      if (!hasAccess) {
        throw new UnauthorizedException(
          'User does not have access to this application',
        );
      }

      console.log('✅ User authenticated, generating SAML Response');

      // Generate SAML Response
      const { samlResponse, relayState: responseRelayState } =
        await this.samlIdpService.createSamlResponse(
          organizationId,
          user,
          authnRequest.id,
          authnRequest.acsUrl,
          authnRequest.issuer,
          relayState,
        );

      console.log('📤 Sending SAML Response to SP ACS:', authnRequest.acsUrl);

      // Return HTML form that auto-submits to SP's ACS
      return res.send(this.createAutoSubmitForm(
        authnRequest.acsUrl,
        samlResponse,
        responseRelayState,
      ));
    } catch (error: any) {
      console.error('❌ SAML IDP error:', error);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * POST /api/v1/sso/saml-idp/:orgId/sso
   * Handle SAML AuthnRequest via HTTP-POST binding
   */
  @Post('sso')
  async handleSsoPost(
    @Param('orgId') organizationId: string,
    @Body('SAMLRequest') samlRequest: string,
    @Body('RelayState') relayState: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!samlRequest) {
      throw new BadRequestException('SAMLRequest parameter is required');
    }

    try {
      // Parse the SAML AuthnRequest
      const authnRequest = await this.samlIdpService.parseAuthnRequest(
        organizationId,
        samlRequest,
      );

      console.log('📥 SAML AuthnRequest received (POST):', {
        organizationId,
        requestId: authnRequest.id,
        issuer: authnRequest.issuer,
        acsUrl: authnRequest.acsUrl,
        relayState,
      });

      // Check if user is authenticated
      const user = await this.getCurrentUser(req);

      if (!user) {
        // User not authenticated - redirect to login page
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3001').split(',')[0].trim();
        const proto = req.get('x-forwarded-proto') || req.protocol;
        const backendUrl = `${proto}://${req.get('host')}`;
        const returnUrl = encodeURIComponent(`${backendUrl}${req.originalUrl}`);
        const loginUrl = `${frontendUrl}/login?returnUrl=${returnUrl}`;

        console.log('⚠️  User not authenticated, redirecting to login');
        return res.redirect(loginUrl);
      }

      // Verify user has access to this application
      const hasAccess = await this.samlIdpService.verifyUserAccess(
        user,
        organizationId,
        authnRequest.issuer,
      );

      if (!hasAccess) {
        throw new UnauthorizedException(
          'User does not have access to this application',
        );
      }

      console.log('✅ User authenticated, generating SAML Response');

      // Generate SAML Response
      const { samlResponse, relayState: responseRelayState } =
        await this.samlIdpService.createSamlResponse(
          organizationId,
          user,
          authnRequest.id,
          authnRequest.acsUrl,
          authnRequest.issuer,
          relayState,
        );

      console.log('📤 Sending SAML Response to SP ACS:', authnRequest.acsUrl);

      // Return HTML form that auto-submits to SP's ACS
      return res.send(this.createAutoSubmitForm(
        authnRequest.acsUrl,
        samlResponse,
        responseRelayState,
      ));
    } catch (error: any) {
      console.error('❌ SAML IDP error:', error);
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

  /**
   * Create HTML form that auto-submits SAML Response to SP's ACS
   */
  private createAutoSubmitForm(
    acsUrl: string,
    samlResponse: string,
    relayState?: string,
  ): string {
    const relayStateInput = relayState
      ? `<input type="hidden" name="RelayState" value="${this.escapeHtml(relayState)}" />`
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <title>SAML Response</title>
</head>
<body onload="document.forms[0].submit()">
  <noscript>
    <p><strong>Note:</strong> JavaScript is required to continue.</p>
  </noscript>
  <form method="post" action="${this.escapeHtml(acsUrl)}">
    <input type="hidden" name="SAMLResponse" value="${this.escapeHtml(samlResponse)}" />
    ${relayStateInput}
    <noscript>
      <button type="submit">Continue</button>
    </noscript>
  </form>
</body>
</html>
    `.trim();
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
