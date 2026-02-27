import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as crypto from 'crypto';
import { RegexService } from '../utils/regex.service';
import { OidcConfigService } from './oidc-config.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class OidcIdpService {
  private providerInstances: Map<string, any> = new Map();
  private ProviderClass: any;

  protected async dynamicImport(specifier: string) {
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    return dynamicImport(specifier);
  }

  protected async loadProvider() {
    if (!this.ProviderClass) {
      const mod = await this.dynamicImport('oidc-provider');
      this.ProviderClass = mod.default;
    }
    return this.ProviderClass;
  }

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private regexService: RegexService,
    private oidcConfigService: OidcConfigService,
    private auditService: AuditService,
  ) { }

  /**
   * Get or create OIDC Provider instance for an application
   */
  async getProviderInstance(applicationId: string): Promise<any> {
    // Check cache
    if (this.providerInstances.has(applicationId)) {
      return this.providerInstances.get(applicationId)!;
    }

    // Get application
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new BadRequestException('Application not found');
    }

    // Load dynamic configuration (now at app level)
    const [tokenPolicy, signingKeys, customScopes, customClaims] = await Promise.all([
      this.oidcConfigService.getTokenPolicy(applicationId),
      this.oidcConfigService.getSigningKeysWithPrivate(applicationId),
      this.oidcConfigService.getScopes(applicationId),
      this.oidcConfigService.getClaims(applicationId),
    ]);

    const baseUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
    const issuer = `${baseUrl}/api/v1/sso/oidc-idp/${applicationId}`;

    // Create OIDC Provider instance
    const ProviderClass = await this.loadProvider();
    const provider = new ProviderClass(issuer, {
      proxy: true,

      // Adapter still needs to store tokens — we'll pass applicationId for filtering
      adapter: this.createAdapter(applicationId),

      // Build dynamic grant types based on per-app settings
      // Client registration - only this specific client for this instance
      clients: (() => {
        const clientGrants = ['authorization_code', 'refresh_token'];
        if (application.allowClientCredentials) clientGrants.push('client_credentials');
        return [{
          client_id: application.clientId,
          client_secret: application.clientSecretHash || undefined,
          grant_types: clientGrants,
          redirect_uris: (application.redirectUris as string[]).length > 0
            ? application.redirectUris as string[]
            : ['https://localhost/cb'],
          response_types: ['code'],
          token_endpoint_auth_method: application.clientSecretHash ? 'client_secret_post' : 'none',
          scope: Array.from(new Set([
            'openid', 'profile', 'email', 'offline_access',
            ...(application.scopes as string[] || []),
          ])).join(' '),
        }];
      })(),

      // JWKS — private keys needed for signing tokens
      jwks: signingKeys.length > 0 ? {
        keys: signingKeys.map((k: any) => {
          try {
            return JSON.parse(k.privateKey);
          } catch {
            // Legacy format fallback: raw key components
            return {
              kty: 'RSA', kid: k.kid, n: k.publicKey,
              e: 'AQAB', alg: k.algorithm, use: 'sig',
            };
          }
        }),
      } : undefined,

      // Features
      features: {
        devInteractions: { enabled: false }, // Use custom interaction flow
        registration: { enabled: false }, // Dynamic client registration disabled for now
        revocation: { enabled: true },
        introspection: { enabled: true },
        ...(application.allowClientCredentials ? { clientCredentials: { enabled: true } } : {}),
      },

      // Issue JWT access tokens (self-contained, verifiable without introspection)
      formats: {
        AccessToken: 'jwt',
      },

      // Claims — register app-level scopes (e.g. ai:tool:call) so oidc-provider
      // doesn't strip them as unknown
      claims: {
        openid: ['sub'],
        email: ['email', 'email_verified'],
        profile: ['name', 'given_name', 'family_name', 'updated_at'],
        ...(application.scopes as string[] || []).reduce((acc: any, s: string) => {
          if (!['openid', 'profile', 'email', 'offline_access'].includes(s)) {
            acc[s] = [];
          }
          return acc;
        }, {}),
      },

      // Find account by ID
      findAccount: async (ctx: any, sub: string): Promise<any> => {
        return this.findAccount(applicationId, sub);
      },

      // Extra access token claims for AI agents
      extraAccessTokenClaims: async (ctx: any, token: any) => {
        const claims: any = {};

        if (application.isAiAgent && ctx.oidc?.grant?.type === 'client_credentials') {
          claims.typ = 'ai_agent';
          claims.agent_id = application.clientId;

          if (application.aiAgentMetadata) {
            const metadata = application.aiAgentMetadata as any;
            if (metadata.agentVersion) claims.agent_version = metadata.agentVersion;
            if (metadata.toolCapabilities) claims.tool_capabilities = metadata.toolCapabilities;
          }
        }

        return claims;
      },

      // OAuth 2.1: only authorization code flow (no implicit)
      responseTypes: ['code'],

      // Grant types (dynamic per application)
      grantTypes: (() => {
        const grants = ['authorization_code', 'refresh_token'];
        if (application.allowClientCredentials) grants.push('client_credentials');
        return grants;
      })(),

      // Route paths — must match what NestJS exposes
      routes: {
        authorization: '/authorize',
        resume: '/authorize/:uid',
        userinfo: '/userinfo',
      },

      // PKCE: OAuth 2.1 requires PKCE for all authorization_code flows
      pkce: {
        required: (_ctx: any, _client: any) => true,
        methods: ['S256'], // Only SHA-256, no 'plain' method
      },

      // Interaction URL — points to backend auto-confirm endpoint so the
      // browser roundtrip carries the signed interaction cookies naturally.
      interactions: {
        url: async (ctx: any, interaction: any): Promise<string> => {
          const backendUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
          const apiPrefix = this.config.get<string>('API_PREFIX') || 'api/v1';
          return `${backendUrl}/${apiPrefix}/sso/oidc-idp/${applicationId}/auto-confirm?uid=${interaction.uid}`;
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

        // Log more details for debugging
        console.error(`❌ OIDC Error [${errCode}]: ${errMsg}`);
        console.error('Context Params:', ctx.query || ctx.params);
        if (error) console.error('Original Error:', error);
        if (out) console.error('Error Details (out):', out);

        const frontendUrl = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001').split(',')[0].trim();
        ctx.status = 302;
        ctx.redirect(`${frontendUrl}/auth/error?error=${encodeURIComponent(errCode)}&error_description=${encodeURIComponent(errMsg)}`);
      },
    });

    // Register ROPC (password) grant handler if enabled for this application
    if (application.allowROPC) {
      await this.registerPasswordGrant(provider, application, applicationId);
    }

    // Cache the instance
    this.providerInstances.set(applicationId, provider);

    return provider;
  }

  /**
   * Register custom password (ROPC) grant type on the oidc-provider instance.
   * Issues access_token only (no id_token). Optional refresh_token based on app config.
   */
  private async registerPasswordGrant(
    provider: any,
    application: any,
    applicationId: string,
  ): Promise<void> {
    const prisma = this.prisma;
    const auditService = this.auditService;
    const bcryptMod = await this.dynamicImport('bcrypt');

    provider.registerGrantType('password', async function passwordGrant(ctx: any, next: any) {
      const { client } = ctx.oidc;
      const { username, password: pwd, scope: requestedScope } = ctx.oidc.params;

      if (!username || !pwd) {
        ctx.body = { error: 'invalid_grant', error_description: 'username and password are required' };
        ctx.status = 400;
        return next();
      }

      // Find user
      const user = await prisma.user.findFirst({
        where: {
          email: username,
        },
      });

      if (!user || !user.passwordHash) {
        await auditService.log({
          action: 'oauth.ropc',
          resource: `application:${applicationId}`,
          result: 'FAILURE',
          metadata: { username, reason: 'invalid_credentials', grant_type: 'password' },
          riskScore: 0.7,
        });
        ctx.body = { error: 'invalid_grant', error_description: 'invalid username or password' };
        ctx.status = 400;
        return next();
      }

      const valid = await bcryptMod.compare(pwd, user.passwordHash);
      if (!valid) {
        await auditService.log({
          userId: user.id,
          action: 'oauth.ropc',
          resource: `application:${applicationId}`,
          result: 'FAILURE',
          metadata: { username, reason: 'wrong_password', grant_type: 'password' },
          riskScore: 0.8,
        });
        ctx.body = { error: 'invalid_grant', error_description: 'invalid username or password' };
        ctx.status = 400;
        return next();
      }

      // Issue access token only (NO id_token for ROPC per spec)
      const scope = requestedScope || 'openid';
      const at = new provider.AccessToken({
        accountId: user.id,
        client,
        grantId: ctx.oidc.uid || crypto.randomUUID(),
        scope,
      });
      at.setAudiences(client.clientId);

      const accessToken = await at.save();
      const tokenType = at.tokenType || 'Bearer';

      ctx.body = {
        access_token: accessToken,
        token_type: tokenType,
        expires_in: at.expiration,
        scope,
      };

      // Optionally issue refresh token
      if (application.allowRefreshForROPC) {
        const rt = new provider.RefreshToken({
          accountId: user.id,
          client,
          grantId: ctx.oidc.uid || crypto.randomUUID(),
          scope,
        });
        const refreshToken = await rt.save();
        ctx.body.refresh_token = refreshToken;
      }

      await auditService.log({
        userId: user.id,
        action: 'oauth.ropc',
        resource: `application:${applicationId}`,
        result: 'SUCCESS',
        metadata: { username, scope, grant_type: 'password' },
        riskScore: 0.5,
      });

      await next();
    }, ['username', 'password', 'scope']);
  }

  /**
   * Create database adapter for oidc-provider
   */
  private createAdapter(applicationId: string) {
    const prisma = this.prisma;

    return class Adapter {
      constructor(public name: string) { }

      async upsert(id: string, payload: any, expiresIn: number) {
        const expiresAt = new Date(Date.now() + expiresIn * 1000);

        await prisma.oidcToken.upsert({
          where: {
            applicationId_type_tokenId: {
              applicationId,
              type: this.name,
              tokenId: id,
            },
          },
          create: {
            applicationId,
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
            applicationId_type_tokenId: {
              applicationId,
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
            applicationId,
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
            applicationId,
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
            applicationId_type_tokenId: {
              applicationId,
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
            applicationId_type_tokenId: {
              applicationId,
              type: this.name,
              tokenId: id,
            },
          },
        });
      }

      async revokeByGrantId(grantId: string) {
        await prisma.oidcToken.deleteMany({
          where: {
            applicationId,
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
   * Get registered OIDC clients (not used in single-app mode, kept for compatibility)
   */
  private async getClients(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) return [];

    const isPublic = !application.clientSecretHash;
    return [{
      client_id: application.clientId,
      ...(!isPublic ? { client_secret: application.clientSecretHash } : {}),
      grant_types: ['authorization_code', 'refresh_token'],
      redirect_uris: application.redirectUris as string[],
      post_logout_redirect_uris: application.redirectUris as string[],
      response_types: ['code'],
      token_endpoint_auth_method: isPublic ? 'none' : 'client_secret_post',
    }];
  }

  /**
   * Find user account by ID
   */
  private async findAccount(applicationId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return undefined;
    }

    const customClaims = await this.oidcConfigService.getClaims(applicationId);

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
          // Use string comparisons if enum import is problematic
          const target = use === 'id_token' ? 'ID_TOKEN' :
            use === 'userinfo' ? 'USERINFO' :
              'ACCESS_TOKEN';

          if (!claimDef.targetTokens.includes(target as any)) {
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
    applicationId: string,
    _uid: string,
    actorId: string,
    consent: boolean,
    req: any,
    res: any,
  ): Promise<string> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId }
    });
    if (!application) throw new BadRequestException('Application not found');

    const provider = await this.getProviderInstance(applicationId);
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
   * Get OIDC discovery metadata (dynamic per application)
   */
  async getDiscoveryMetadata(applicationId: string) {
    const baseUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
    const issuer = `${baseUrl}/api/v1/sso/oidc-idp/${applicationId}`;

    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { allowROPC: true, allowClientCredentials: true },
    });

    const grantTypes = ['authorization_code', 'refresh_token'];
    if (app?.allowClientCredentials) grantTypes.push('client_credentials');
    if (app?.allowROPC) grantTypes.push('password');

    return {
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      userinfo_endpoint: `${issuer}/userinfo`,
      jwks_uri: `${issuer}/jwks`,
      registration_endpoint: `${issuer}/register`,
      scopes_supported: ['openid', 'email', 'profile', 'offline_access'],
      response_types_supported: ['code'],
      grant_types_supported: grantTypes,
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
   * '/api/v1/sso/oidc-idp/:appId'. Used to strip the prefix from req.url
   * before forwarding to oidc-provider's Koa app (which registers routes
   * without this prefix).
   */
  private getIssuerPath(applicationId: string): string {
    const baseUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
    return new URL(`${baseUrl}/api/v1/sso/oidc-idp/${applicationId}`).pathname;
  }

  /**
   * Forward an Express req/res to oidc-provider's Koa app, stripping the
   * issuer path prefix from req.url first so Koa's router can match routes.
   * Use this in every controller handler that delegates to oidc-provider.
   */
  async dispatchToProvider(applicationId: string, req: any, res: any): Promise<void> {
    const provider = await this.getProviderInstance(applicationId);
    const issuerPath = this.getIssuerPath(applicationId);
    let originalUrl: string = req.url || '';
    originalUrl = originalUrl.replace(/[\n\r]/g, '');

    console.log(`🔍 [OIDC] Dispatching request. Original URL: ${originalUrl}, Issuer Path: ${issuerPath}`);

    req.url = originalUrl.startsWith(issuerPath)
      ? originalUrl.slice(issuerPath.length) || '/'
      : originalUrl;

    console.log(`🔍 [OIDC] Stripped URL: ${req.url}`);

    await (provider.app.callback())(req, res);
    req.url = originalUrl;
  }

  /**
   * Clear cached provider instance (keyed by applicationId)
   */
  clearProviderCache(applicationId: string): void {
    this.providerInstances.delete(applicationId);
  }
}
