import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SsoService } from '../sso.service';
import { Issuer, generators } from 'openid-client';
import * as crypto from 'crypto';

@Injectable()
export class OidcClientService {
  constructor(
    private prisma: PrismaService,
    private ssoService: SsoService,
  ) {}

  /**
   * Get OIDC configuration for a provider
   */
  private async getOidcConfig(providerId: string) {
    const provider = await this.ssoService.getProviderWithSecrets(providerId);

    if (!provider.oidcIssuer || !provider.oidcClientId) {
      throw new BadRequestException('Invalid OIDC configuration');
    }

    const baseUrl = (process.env.BACKEND_URL || 'http://localhost:3000').split(',')[0].trim();
    const redirectUri = `${baseUrl}/api/v1/sso/oidc/${providerId}/callback`;

    try {
      // Discover OIDC provider configuration
      const issuer = await Issuer.discover(provider.oidcIssuer);
      const client = new issuer.Client({
        client_id: provider.oidcClientId,
        client_secret: provider.oidcClientSecret || undefined,
        redirect_uris: [redirectUri],
        response_types: ['code'],
      });

      return { client, redirectUri, provider };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to initialize OIDC client: ${error.message}`,
      );
    }
  }

  /**
   * Generate random nonce
   */
  private generateNonce(): string {
    return generators.nonce();
  }

  /**
   * Generate random state
   */
  private generateState(): string {
    return generators.state();
  }

  /**
   * Generate OIDC authorization URL
   */
  async getAuthorizationUrl(
    providerId: string,
    state?: string,
  ): Promise<{ url: string; codeVerifier: string; nonce: string }> {
    const providerData = await this.prisma.ssoProvider.findUnique({
      where: { id: providerId },
    });

    if (!providerData) {
      throw new BadRequestException('SSO provider not found');
    }

    const { client, redirectUri } = await this.getOidcConfig(providerId);

    // Generate PKCE code verifier and challenge
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    // Generate nonce and state
    const nonce = this.generateNonce();
    const stateValue = state || this.generateState();

    // Build authorization URL
    const authorizationUrl = client.authorizationUrl({
      redirect_uri: redirectUri,
      scope:
        (providerData.oidcScopes || ['openid', 'profile', 'email']).join(' '),
      state: stateValue,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return { url: authorizationUrl, codeVerifier, nonce };
  }

  /**
   * Exchange authorization code for tokens and get user profile
   */
  async handleCallback(
    providerId: string,
    code: string,
    codeVerifier: string,
    nonce: string,
  ): Promise<{
    externalId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    attributes: any;
  }> {
    const { client, redirectUri } = await this.getOidcConfig(providerId);

    try {
      // Build callback parameters
      const params = { code };

      // Exchange authorization code for tokens
      const tokenSet = await client.callback(redirectUri, params, {
        code_verifier: codeVerifier,
        nonce,
      });

      // Extract ID token claims
      const claims = tokenSet.claims();

      // Get user info if access token is available
      let userinfo: any = {};
      if (tokenSet.access_token) {
        try {
          userinfo = await client.userinfo(tokenSet.access_token);
        } catch (error) {
          // If userinfo fails, just use ID token claims
          console.warn('Failed to fetch userinfo, using ID token claims only');
        }
      }

      // Extract user data (prefer userinfo over ID token claims)
      const externalId = (userinfo.sub || claims.sub) as string;
      const email = (userinfo.email || claims.email) as string;

      if (!externalId || !email) {
        throw new BadRequestException('OIDC response missing required claims');
      }

      return {
        externalId,
        email,
        firstName: (userinfo.given_name || claims.given_name) as
          | string
          | undefined,
        lastName: (userinfo.family_name || claims.family_name) as
          | string
          | undefined,
        attributes: { ...claims, ...userinfo },
      };
    } catch (error: any) {
      throw new BadRequestException(`OIDC callback failed: ${error.message}`);
    }
  }

  /**
   * Get or create SSO identity (link user to external identity)
   */
  async getOrCreateSsoIdentity(
    providerId: string,
    externalId: string,
    email: string,
    attributes: any,
  ) {
    const provider = await this.prisma.ssoProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new BadRequestException('SSO provider not found');
    }

    // Check if identity exists
    let identity = await this.prisma.ssoIdentity.findUnique({
      where: {
        ssoProviderId_externalId: {
          ssoProviderId: providerId,
          externalId,
        },
      },
      include: {
        user: true,
      },
    });

    if (identity) {
      // Update last login
      identity = await this.prisma.ssoIdentity.update({
        where: { id: identity.id },
        data: {
          lastLoginAt: new Date(),
          attributes,
        },
        include: {
          user: true,
        },
      });

      return identity.user;
    }

    // Auto-provision new user if enabled
    if (!provider.autoProvision) {
      throw new BadRequestException(
        'User does not exist and auto-provisioning is disabled',
      );
    }

    // Check domain restrictions
    if (provider.allowedDomains.length > 0) {
      const emailDomain = email.split('@')[1];
      if (!provider.allowedDomains.includes(emailDomain)) {
        throw new BadRequestException(
          `Email domain ${emailDomain} is not allowed for this SSO provider`,
        );
      }
    }

    // Create user and link identity
    const user = await this.prisma.user.create({
      data: {
        email,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        firstName: attributes.given_name,
        lastName: attributes.family_name,
        status: 'ACTIVE',
        lastLoginAt: new Date(),
        ssoIdentities: {
          create: {
            ssoProviderId: providerId,
            externalId,
            externalEmail: email,
            issuer: provider.oidcIssuer || '',
            attributes,
            firstLoginAt: new Date(),
            lastLoginAt: new Date(),
          },
        },
      },
    });

    return user;
  }
}
