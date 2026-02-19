import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
// oidc-provider v9 is ESM-only — must use dynamic import().
// TypeScript with "module": "commonjs" compiles import() to require(),
// so we use new Function() to prevent the transformation.
const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
import { User } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OidcIdpService {
  private providerInstances: Map<string, any> = new Map();
  private ProviderClass: any;

  protected async loadProvider() {
    if (!this.ProviderClass) {
      const mod = await dynamicImport('oidc-provider');
      this.ProviderClass = mod.default;
    }
    return this.ProviderClass;
  }

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) { }

  /**
   * Get or create OIDC Provider instance for an organization
   */
  async getProviderInstance(organizationId: string): Promise<any> {
    // Check cache
    if (this.providerInstances.has(organizationId)) {
      return this.providerInstances.get(organizationId)!;
    }

    // Get organization
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    const baseUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
    const issuer = `${baseUrl}/api/v1/sso/oidc-idp/${organizationId}`;

    // Create OIDC Provider instance
    const ProviderClass = await this.loadProvider();
    const provider = new ProviderClass(issuer, {
      // Trust X-Forwarded-Proto / X-Forwarded-Host from reverse proxies (Railway, Netlify).
      proxy: true,

      // Adapter for storing authorization codes, tokens, etc.
      adapter: this.createAdapter(organizationId),

      // Client registration
      clients: await this.getClients(organizationId),

      // Features
      features: {
        devInteractions: { enabled: false }, // Use custom interaction flow
        registration: { enabled: false }, // Dynamic client registration disabled for now
        revocation: { enabled: true },
        introspection: { enabled: true },
      },

      // Token TTLs
      ttl: {
        AccessToken: 3600, // 1 hour
        AuthorizationCode: 600, // 10 minutes
        IdToken: 3600, // 1 hour
        RefreshToken: 86400 * 30, // 30 days
      },

      // Claims
      claims: {
        openid: ['sub'],
        email: ['email', 'email_verified'],
        profile: ['name', 'given_name', 'family_name', 'updated_at'],
      },

      // Find account by ID
      findAccount: async (ctx: any, sub: string): Promise<any> => {
        return this.findAccount(organizationId, sub);
      },

      // Supported response types
      responseTypes: [
        'code',
        'id_token',
        'code id_token',
        'id_token token',
        'code id_token token',
      ],

      // Grant types
      grantTypes: [
        'authorization_code',
        'refresh_token',
        'client_credentials',
      ],

      // PKCE
      pkce: {
        required: () => true, // Always require PKCE
      },

      // Interaction URL (custom consent screen)
      interactions: {
        url: async (ctx: any, interaction: any): Promise<string> => {
          const frontendUrl = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001').split(',')[0].trim();
          return `${frontendUrl}/auth/consent?uid=${interaction.uid}&orgId=${organizationId}`;
        },
      },

      // Cookies
      cookies: {
        keys: [this.config.get<string>('ENCRYPTION_KEY') || 'fallback-secret'],
        long: { signed: true, maxAge: 86400 * 30 * 1000 }, // 30 days
        short: { signed: true, maxAge: 600 * 1000 }, // 10 minutes
      },
    });

    // Cache the instance
    this.providerInstances.set(organizationId, provider);

    return provider;
  }

  /**
   * Create database adapter for oidc-provider
   */
  private createAdapter(organizationId: string) {
    const prisma = this.prisma;

    return class Adapter {
      constructor(public name: string) { }

      async upsert(id: string, payload: any, expiresIn: number) {
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        await prisma.oidcToken.upsert({
          where: {
            organizationId_type_tokenId: {
              organizationId,
              type: this.name,
              tokenId: id,
            },
          },
          create: {
            organizationId,
            type: this.name,
            tokenId: id,
            payload: JSON.stringify(payload),
            expiresAt,
          },
          update: {
            payload: JSON.stringify(payload),
            expiresAt,
          },
        });
      }

      async find(id: string) {
        const token = await prisma.oidcToken.findUnique({
          where: {
            organizationId_type_tokenId: {
              organizationId,
              type: this.name,
              tokenId: id,
            },
          },
        });

        if (!token || token.expiresAt < new Date()) {
          return undefined;
        }

        return JSON.parse(token.payload);
      }

      async findByUserCode(userCode: string) {
        const token = await prisma.oidcToken.findFirst({
          where: {
            organizationId,
            type: this.name,
            payload: {
              contains: userCode,
            },
          },
        });

        if (!token || token.expiresAt < new Date()) {
          return undefined;
        }

        return JSON.parse(token.payload);
      }

      async findByUid(uid: string) {
        const token = await prisma.oidcToken.findFirst({
          where: {
            organizationId,
            type: this.name,
            payload: {
              contains: uid,
            },
          },
        });

        if (!token || token.expiresAt < new Date()) {
          return undefined;
        }

        return JSON.parse(token.payload);
      }

      async consume(id: string) {
        await prisma.oidcToken.update({
          where: {
            organizationId_type_tokenId: {
              organizationId,
              type: this.name,
              tokenId: id,
            },
          },
          data: {
            consumed: true,
            consumedAt: new Date(),
          },
        });
      }

      async destroy(id: string) {
        await prisma.oidcToken.delete({
          where: {
            organizationId_type_tokenId: {
              organizationId,
              type: this.name,
              tokenId: id,
            },
          },
        });
      }

      async revokeByGrantId(grantId: string) {
        await prisma.oidcToken.deleteMany({
          where: {
            organizationId,
            type: this.name,
            payload: {
              contains: grantId,
            },
          },
        });
      }
    };
  }

  /**
   * Get registered OIDC clients for the organization
   */
  private async getClients(organizationId: string) {
    const applications = await this.prisma.application.findMany({
      where: {
        organizationId,
        type: 'OIDC',
        status: 'ACTIVE',
      },
    });

    return applications.map((app) => ({
      client_id: app.clientId,
      client_secret: app.clientSecretHash || undefined, // Stored as hash
      grant_types: ['authorization_code', 'refresh_token'],
      redirect_uris: app.redirectUris,
      post_logout_redirect_uris: app.redirectUris,
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post',
    }));
  }

  /**
   * Find user account by ID
   */
  private async findAccount(organizationId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationMembers: {
          some: {
            organizationId,
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!user) {
      return undefined;
    }

    return {
      accountId: user.id,
      async claims(use: string, scope: string): Promise<any> {
        return {
          sub: user.id,
          email: user.email,
          email_verified: user.emailVerified,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          given_name: user.firstName,
          family_name: user.lastName,
          updated_at: user.updatedAt.getTime() / 1000,
        };
      },
    };
  }

  /**
   * Full authorize flow for an already-authenticated user.
   *
   * Strategy:
   *  1. Forward the (prefix-stripped) request to oidc-provider so it creates
   *     the Interaction record and sets the interaction session cookies on res.
   *  2. Intercept the redirect to the consent URL by overriding res.end —
   *     this prevents the response from being flushed to the socket.
   *  3. Inject the Set-Cookie values oidc-provider wrote into req.headers.cookie
   *     so that interactionDetails() can verify them.
   *  4. Auto-confirm the interaction (consent = true).
   *  5. Redirect the browser to the returnTo (resume) URL, forwarding the
   *     interaction cookies so oidc-provider can read the session on resume.
   */
  async handleAuthorizeAsAuthenticated(
    organizationId: string,
    userId: string,
    req: any,
    res: any,
  ): Promise<void> {
    const provider = await this.getProviderInstance(organizationId);
    const origEnd = (res.end as Function).bind(res);
    let intercepted = false;

    // Override res.end to intercept oidc-provider's redirect to the interaction URL.
    // All res.setHeader() calls (cookies, Location) have already been recorded on res
    // but nothing has been written to the socket yet.
    res.end = (...args: any[]) => {
      const location = res.getHeader('location') as string | undefined;
      if (location?.includes('uid=')) {
        intercepted = true;
        return res; // block — we will send the final redirect ourselves
      }
      // Error / non-interaction response — let oidc-provider handle it normally
      return origEnd(...args);
    };

    await provider.app.callback()(req, res);
    res.end = origEnd; // restore

    if (!intercepted) {
      // oidc-provider already sent its own response (e.g. an error) — nothing to do
      return;
    }

    const interactionLocation = res.getHeader('location') as string;
    let uid: string | null = null;
    try {
      uid = new URL(interactionLocation).searchParams.get('uid');
    } catch {
      uid = new URLSearchParams(interactionLocation.split('?')[1] ?? '').get('uid');
    }

    if (!uid) {
      // Cannot determine UID — fall back to the original redirect
      res.statusCode = 302;
      origEnd('');
      return;
    }

    // Inject the interaction session cookies oidc-provider wrote to res
    // into req.headers.cookie so that interactionDetails() can find them.
    const setCookies = res.getHeader('set-cookie');
    if (setCookies) {
      const cookieStrings: string[] = Array.isArray(setCookies)
        ? (setCookies as string[])
        : [String(setCookies)];
      const pairs = cookieStrings
        .map((c) => c.split(';')[0].trim())
        .filter(Boolean);
      const existing: string = req.headers?.cookie ?? '';
      req.headers.cookie = existing ? `${existing}; ${pairs.join('; ')}` : pairs.join('; ');
    }

    // Auto-confirm the interaction — calls interactionResult internally
    const returnTo = await this.handleInteraction(organizationId, uid, userId, true, req, res);

    // Send the redirect. The Set-Cookie headers oidc-provider wrote are still
    // queued in res (via setHeader) — origEnd() will flush them together with
    // the new Location so the browser receives the interaction cookies.
    res.statusCode = 302;
    res.setHeader('Location', returnTo);
    origEnd('');
  }

  /**
   * Handle interaction (consent).
   * Uses interactionResult (not interactionFinished) so the response is NOT
   * sent by oidc-provider — the caller is responsible for redirecting.
   * Returns the returnTo URL for the caller to redirect the user to.
   */
  async handleInteraction(
    organizationId: string,
    _uid: string,
    actorId: string,
    consent: boolean,
    req: any,
    res: any,
  ): Promise<string> {
    const provider = await this.getProviderInstance(organizationId);
    const interaction = await provider.interactionDetails(req, res);

    if (!consent) {
      const returnTo = await provider.interactionResult(req, res, {
        error: 'access_denied',
        error_description: 'User denied consent',
      }, { mergeWithLastSubmission: false });
      return returnTo;
    }

    // Build grant
    const grant = new provider.Grant({
      accountId: actorId,
      clientId: interaction.params.client_id as string,
    });

    const requestedScopes = interaction.prompt?.details?.missingOIDCScope as string[] | undefined;
    if (requestedScopes) {
      grant.addOIDCScope(requestedScopes.join(' '));
    } else if (interaction.params.scope) {
      grant.addOIDCScope(interaction.params.scope as string);
    }

    const requestedClaims = interaction.prompt?.details?.missingOIDCClaims as string[] | undefined;
    if (requestedClaims) {
      grant.addOIDCClaims(requestedClaims);
    }

    const grantId = await grant.save();

    const returnTo = await provider.interactionResult(req, res, {
      login: { accountId: actorId },
      consent: { grantId },
    }, { mergeWithLastSubmission: false });

    return returnTo;
  }

  /**
   * Get OIDC discovery metadata
   */
  async getDiscoveryMetadata(organizationId: string) {
    const baseUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
    const issuer = `${baseUrl}/api/v1/sso/oidc-idp/${organizationId}`;

    return {
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      userinfo_endpoint: `${issuer}/userinfo`,
      jwks_uri: `${issuer}/jwks`,
      registration_endpoint: `${issuer}/register`,
      scopes_supported: ['openid', 'email', 'profile'],
      response_types_supported: [
        'code',
        'id_token',
        'code id_token',
        'id_token token',
        'code id_token token',
      ],
      grant_types_supported: [
        'authorization_code',
        'refresh_token',
        'client_credentials',
      ],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      token_endpoint_auth_methods_supported: [
        'client_secret_post',
        'client_secret_basic',
      ],
      claims_supported: [
        'sub',
        'email',
        'email_verified',
        'name',
        'given_name',
        'family_name',
        'updated_at',
      ],
      code_challenge_methods_supported: ['S256'],
    };
  }

  /**
   * Clear cached provider instance
   */
  clearProviderCache(organizationId: string): void {
    this.providerInstances.delete(organizationId);
  }
}
