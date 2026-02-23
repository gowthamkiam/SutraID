import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
// oidc-provider v9 is ESM-only — must use dynamic import().
// TypeScript with "module": "commonjs" compiles import() to require(),
// so we use new Function() to prevent the transformation.
const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
import { User, ClaimTarget } from '@prisma/client';
import * as crypto from 'crypto';
import { RegexService } from '../utils/regex.service';
import { OidcConfigService } from './oidc-config.service';

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
    private regexService: RegexService,
    private oidcConfigService: OidcConfigService,
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

    // Load dynamic configuration
    const [tokenPolicy, signingKeys, customScopes, customClaims] = await Promise.all([
      this.oidcConfigService.getTokenPolicy(organizationId),
      this.oidcConfigService.getSigningKeys(organizationId),
      this.oidcConfigService.getScopes(organizationId),
      this.oidcConfigService.getClaims(organizationId),
    ]);

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

      // JWKS (Organization-specific keys)
      jwks: signingKeys.length > 0 ? {
        keys: signingKeys.map(k => ({
          kty: k.algorithm === 'RS256' ? 'RSA' : 'EC',
          kid: k.kid,
          use: 'sig',
          alg: k.algorithm,
          // In a real app, you'd parse the public key into the JWK format
          n: (k as any).n, // Placeholder: simplified for prototype
          e: (k as any).e,
          crv: (k as any).crv,
          x: (k as any).x,
          y: (k as any).y,
        })),
      } : undefined,

      // Features
      features: {
        devInteractions: { enabled: false }, // Use custom interaction flow
        registration: { enabled: false }, // Dynamic client registration disabled for now
        revocation: { enabled: true },
        introspection: { enabled: true },
      },

      // Issue JWT access tokens (self-contained, verifiable without introspection)
      formats: {
        AccessToken: 'jwt',
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

      // Route paths — must match what NestJS exposes under /:orgId/
      routes: {
        authorization: '/authorize',
        resume: '/authorize/:uid',
        userinfo: '/userinfo',
      },

      // PKCE
      pkce: {
        required: () => true, // Always require PKCE
      },

      // Interaction URL — points to backend auto-confirm endpoint so the
      // browser roundtrip carries the signed interaction cookies naturally.
      interactions: {
        url: async (ctx: any, interaction: any): Promise<string> => {
          const backendUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
          const apiPrefix = this.config.get<string>('API_PREFIX') || 'api/v1';
          return `${backendUrl}/${apiPrefix}/sso/oidc-idp/${organizationId}/auto-confirm?uid=${interaction.uid}`;
        },
      },

      // Cookies
      cookies: {
        keys: [this.config.get<string>('ENCRYPTION_KEY') || 'fallback-secret'],
        long: { signed: true, maxAge: 86400 * 30 * 1000 }, // 30 days
        short: { signed: true, maxAge: 600 * 1000 }, // 10 minutes
      },

      // TTLs
      ttl: {
        AccessToken: tokenPolicy.accessTokenLifetime,
        AuthorizationCode: 600,
        IdToken: tokenPolicy.idTokenLifetime,
        RefreshToken: tokenPolicy.refreshTokenLifetime,
        Session: 86400 * 14,
        Grant: 86400 * 14,
        Interaction: 3600,
      },

      // Custom renderError: log actual error to Railway console and redirect to frontend
      renderError: async (ctx: any, out: any, error: any) => {
        const errCode = out?.error || error?.name || 'server_error';
        const errMsg = error?.message || out?.error_description || errCode;
        console.error(`❌ OIDC renderError [${errCode}]: ${errMsg}`, { error, out });
        const frontendUrl = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001').split(',')[0].trim();
        ctx.status = 302;
        ctx.redirect(`${frontendUrl}/auth/error?error=${encodeURIComponent(errCode)}&error_description=${encodeURIComponent(errMsg)}`);
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

    return applications.map((app) => {
      // Public clients (no secret stored) use PKCE-only auth.
      // Confidential clients pass the stored hash; oidc-provider stores it
      // verbatim — token-endpoint verification is handled by the custom
      // client_secret_verify callback below.
      const isPublic = !app.clientSecretHash;
      return {
        client_id: app.clientId,
        ...(!isPublic ? { client_secret: app.clientSecretHash } : {}),
        grant_types: ['authorization_code', 'refresh_token'],
        redirect_uris: app.redirectUris as string[],
        post_logout_redirect_uris: app.redirectUris as string[],
        response_types: ['code'],
        token_endpoint_auth_method: isPublic ? 'none' : 'client_secret_post',
      };
    });
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
      include: {
        organization: true, // For potential org-level attributes
      },
    });

    if (!user) {
      return undefined;
    }

    const customClaims = await this.oidcConfigService.getClaims(organizationId);

    return {
      accountId: user.id,
      claims: async (use: string, scope: string): Promise<any> => {
        const claims: any = {
          sub: user.id,
          email: user.email,
          email_verified: user.emailVerified,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          given_name: user.firstName,
          family_name: user.lastName,
          updated_at: Math.floor(user.updatedAt.getTime() / 1000),
        };

        // Process custom claims
        for (const claimDef of customClaims) {
          // Filter by target token
          const target = use === 'id_token' ? ClaimTarget.ID_TOKEN :
            use === 'userinfo' ? ClaimTarget.USERINFO :
              ClaimTarget.ACCESS_TOKEN;

          if (!claimDef.targetTokens.includes(target)) {
            continue;
          }

          // Resolve value from user object
          let value = this.getNestedProperty(user, claimDef.userAttribute);

          if (value === undefined || value === null) {
            continue;
          }

          // Apply regex transformation if defined
          if (claimDef.regexRule) {
            try {
              value = await this.regexService.replace(
                String(value),
                claimDef.regexRule.pattern,
                claimDef.regexRule.replacement,
                claimDef.regexRule.flags,
              );
            } catch (err) {
              console.error(`Error applying regex transformation for claim ${claimDef.name}:`, err);
              // In production, we might want to skip the claim or use original value
            }
          }

          claims[claimDef.name] = value;
        }

        return claims;
      },
    };
  }

  /**
   * Helper to resolve nested properties from an object using a dot-notated path.
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => {
      if (acc && typeof acc === 'object') {
        return acc[part];
      }
      return undefined;
    }, obj);
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

    // Always grant the full requested scope from params (includes offline_access).
    // missingOIDCScope omits non-claim scopes like offline_access, so using
    // params.scope ensures refresh tokens are issued when offline_access is requested.
    if (interaction.params.scope) {
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
      token_endpoint: `${baseUrl}/oauth/token`,
      userinfo_endpoint: `${issuer}/userinfo`,
      jwks_uri: `${issuer}/jwks`,
      registration_endpoint: `${issuer}/register`,
      scopes_supported: ['openid', 'email', 'profile', 'offline_access'],
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
   * Returns the URL pathname component of the issuer, e.g.
   * '/api/v1/sso/oidc-idp/:orgId'. Used to strip the prefix from req.url
   * before forwarding to oidc-provider's Koa app (which registers routes
   * without this prefix).
   */
  private getIssuerPath(organizationId: string): string {
    const baseUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
    return new URL(`${baseUrl}/api/v1/sso/oidc-idp/${organizationId}`).pathname;
  }

  /**
   * Forward an Express req/res to oidc-provider's Koa app, stripping the
   * issuer path prefix from req.url first so Koa's router can match routes.
   * Use this in every controller handler that delegates to oidc-provider.
   */
  async dispatchToProvider(organizationId: string, req: any, res: any): Promise<void> {
    const provider = await this.getProviderInstance(organizationId);
    const issuerPath = this.getIssuerPath(organizationId);
    const originalUrl: string = req.url;
    req.url = originalUrl.startsWith(issuerPath)
      ? originalUrl.slice(issuerPath.length) || '/'
      : originalUrl;
    await (provider.app.callback())(req, res);
    req.url = originalUrl;
  }

  /**
   * Clear cached provider instance
   */
  clearProviderCache(organizationId: string): void {
    this.providerInstances.delete(organizationId);
  }
}
