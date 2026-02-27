import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSsoProviderDto } from './dto/create-sso-provider.dto';
import { UpdateSsoProviderDto } from './dto/update-sso-provider.dto';
import { SsoProtocol } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class SsoService {
  constructor(
    private prisma: PrismaService,
  ) { }

  /**
   * Derive a 32-byte key from ENCRYPTION_KEY (handles any length input)
   */
  private getEncryptionKey(): Buffer {
    const raw = process.env.ENCRYPTION_KEY || '';
    // If it's already a valid 64-char hex string (32 bytes), use directly
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      return Buffer.from(raw, 'hex');
    }
    // Otherwise, hash it to get a consistent 32-byte key
    return crypto.createHash('sha256').update(raw).digest();
  }

  /**
   * Encrypt sensitive data (certificates, secrets)
   */
  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const key = this.getEncryptionKey();

    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Create a new SSO provider
   */
  async create(
    actorId: string,
    dto: CreateSsoProviderDto,
  ) {
    // Validate configuration based on protocol
    if (dto.protocol === SsoProtocol.SAML2) {
      if (!dto.samlEntityId || !dto.samlSsoUrl || !dto.samlCertificate) {
        throw new BadRequestException(
          'SAML protocol requires entityId, ssoUrl, and certificate',
        );
      }
    } else if (dto.protocol === SsoProtocol.OIDC) {
      if (!dto.oidcIssuer || !dto.oidcClientId || !dto.oidcClientSecret) {
        throw new BadRequestException(
          'OIDC protocol requires issuer, clientId, and clientSecret',
        );
      }
    }

    // Encrypt sensitive fields
    const data: any = {
      name: dto.name,
      type: dto.type,
      protocol: dto.protocol,
      enabled: dto.enabled ?? true,
      autoProvision: dto.autoProvision ?? true,
      allowedDomains: dto.allowedDomains || [],
      attributeMapping: dto.attributeMapping || {},
    };

    // Add SAML fields (encrypted)
    if (dto.protocol === SsoProtocol.SAML2) {
      data.samlEntityId = dto.samlEntityId;
      data.samlSsoUrl = dto.samlSsoUrl;
      data.samlCertificate = this.encrypt(dto.samlCertificate!);
      data.samlMetadataUrl = dto.samlMetadataUrl;
    }

    // Add OIDC fields (encrypted secret)
    if (dto.protocol === SsoProtocol.OIDC) {
      data.oidcIssuer = dto.oidcIssuer;
      data.oidcClientId = dto.oidcClientId;
      data.oidcClientSecret = this.encrypt(dto.oidcClientSecret!);
      data.oidcAuthUrl = dto.oidcAuthUrl;
      data.oidcTokenUrl = dto.oidcTokenUrl;
      data.oidcUserinfoUrl = dto.oidcUserinfoUrl;
      data.oidcScopes = dto.oidcScopes || ['openid', 'profile', 'email'];
    }

    return this.prisma.ssoProvider.create({
      data,
      select: {
        id: true,
        name: true,
        type: true,
        protocol: true,
        samlEntityId: true,
        samlSsoUrl: true,
        samlMetadataUrl: true,
        // Do NOT return encrypted certificate
        oidcIssuer: true,
        oidcClientId: true,
        oidcAuthUrl: true,
        oidcTokenUrl: true,
        oidcUserinfoUrl: true,
        oidcScopes: true,
        // Do NOT return encrypted client secret
        attributeMapping: true,
        enabled: true,
        autoProvision: true,
        allowedDomains: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get all SSO providers
   */
  async findAll(actorId: string) {
    return this.prisma.ssoProvider.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        protocol: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get single SSO provider details
   */
  async findOne(providerId: string, actorId: string) {
    const provider = await this.prisma.ssoProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('SSO provider not found');
    }

    // Return without sensitive fields
    return {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      protocol: provider.protocol,
      samlEntityId: provider.samlEntityId,
      samlSsoUrl: provider.samlSsoUrl,
      samlMetadataUrl: provider.samlMetadataUrl,
      oidcIssuer: provider.oidcIssuer,
      oidcClientId: provider.oidcClientId,
      oidcAuthUrl: provider.oidcAuthUrl,
      oidcTokenUrl: provider.oidcTokenUrl,
      oidcUserinfoUrl: provider.oidcUserinfoUrl,
      oidcScopes: provider.oidcScopes,
      attributeMapping: provider.attributeMapping,
      enabled: provider.enabled,
      autoProvision: provider.autoProvision,
      allowedDomains: provider.allowedDomains,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  /**
   * Update SSO provider
   */
  async update(
    providerId: string,
    actorId: string,
    dto: UpdateSsoProviderDto,
  ) {
    const provider = await this.prisma.ssoProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('SSO provider not found');
    }

    const data: any = {
      name: dto.name,
      enabled: dto.enabled,
      autoProvision: dto.autoProvision,
      allowedDomains: dto.allowedDomains,
      attributeMapping: dto.attributeMapping,
    };

    // Update SAML fields
    if (dto.samlEntityId) data.samlEntityId = dto.samlEntityId;
    if (dto.samlSsoUrl) data.samlSsoUrl = dto.samlSsoUrl;
    if (dto.samlCertificate)
      data.samlCertificate = this.encrypt(dto.samlCertificate);
    if (dto.samlMetadataUrl) data.samlMetadataUrl = dto.samlMetadataUrl;

    // Update OIDC fields
    if (dto.oidcIssuer) data.oidcIssuer = dto.oidcIssuer;
    if (dto.oidcClientId) data.oidcClientId = dto.oidcClientId;
    if (dto.oidcClientSecret)
      data.oidcClientSecret = this.encrypt(dto.oidcClientSecret);
    if (dto.oidcAuthUrl) data.oidcAuthUrl = dto.oidcAuthUrl;
    if (dto.oidcTokenUrl) data.oidcTokenUrl = dto.oidcTokenUrl;
    if (dto.oidcUserinfoUrl) data.oidcUserinfoUrl = dto.oidcUserinfoUrl;
    if (dto.oidcScopes) data.oidcScopes = dto.oidcScopes;

    return this.prisma.ssoProvider.update({
      where: { id: providerId },
      data,
      select: {
        id: true,
        name: true,
        type: true,
        protocol: true,
        samlEntityId: true,
        samlSsoUrl: true,
        samlMetadataUrl: true,
        oidcIssuer: true,
        oidcClientId: true,
        oidcAuthUrl: true,
        oidcTokenUrl: true,
        oidcUserinfoUrl: true,
        oidcScopes: true,
        attributeMapping: true,
        enabled: true,
        autoProvision: true,
        allowedDomains: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Delete SSO provider
   */
  async remove(providerId: string, actorId: string) {
    const provider = await this.prisma.ssoProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('SSO provider not found');
    }

    // Delete provider (this will cascade delete identities)
    return this.prisma.ssoProvider.delete({
      where: { id: providerId },
    });
  }

  /**
   * Get provider with decrypted secrets (for internal use only)
   */
  async getProviderWithSecrets(providerId: string) {
    const provider = await this.prisma.ssoProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('SSO provider not found');
    }

    // Decrypt sensitive fields
    if (provider.samlCertificate) {
      provider.samlCertificate = this.decrypt(provider.samlCertificate);
    }

    if (provider.oidcClientSecret) {
      provider.oidcClientSecret = this.decrypt(provider.oidcClientSecret);
    }

    return provider;
  }

  /**
   * Find enabled SSO providers (for login page)
   */
  async findEnabledProviders() {
    return this.prisma.ssoProvider.findMany({
      where: {
        enabled: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        protocol: true,
      },
    });
  }

  /**
   * Discover SSO providers by email domain (public, for login page)
   */
  async discoverByDomain(domain: string) {
    return this.prisma.ssoProvider.findMany({
      where: {
        enabled: true,
        allowedDomains: {
          has: domain,
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        protocol: true,
      },
    });
  }

  /**
   * Test SSO provider connectivity
   */
  async testConnection(providerId: string, actorId: string) {
    const provider = await this.prisma.ssoProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('SSO provider not found');
    }

    const checks: { name: string; passed: boolean; message: string }[] = [];

    if (provider.protocol === 'SAML2') {
      // Check certificate format
      if (provider.samlCertificate) {
        try {
          const cert = this.decrypt(provider.samlCertificate);
          const hasPemHeader = cert.includes('-----BEGIN CERTIFICATE-----');
          checks.push({
            name: 'Certificate Format',
            passed: hasPemHeader,
            message: hasPemHeader
              ? 'Valid PEM certificate format'
              : 'Certificate is missing PEM headers',
          });
        } catch {
          checks.push({
            name: 'Certificate Format',
            passed: false,
            message: 'Failed to decrypt certificate',
          });
        }
      } else {
        checks.push({
          name: 'Certificate Format',
          passed: false,
          message: 'No certificate configured',
        });
      }

      // Check SSO URL reachability
      if (provider.samlSsoUrl) {
        try {
          const response = await fetch(provider.samlSsoUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000),
          });
          checks.push({
            name: 'SSO URL Reachability',
            passed: response.ok || response.status === 405 || response.status === 302,
            message: `SSO URL responded with status ${response.status}`,
          });
        } catch {
          checks.push({
            name: 'SSO URL Reachability',
            passed: false,
            message: 'SSO URL is unreachable',
          });
        }
      } else {
        checks.push({
          name: 'SSO URL Reachability',
          passed: false,
          message: 'No SSO URL configured',
        });
      }
    }

    if (provider.protocol === 'OIDC') {
      // Check OIDC discovery endpoint
      if (provider.oidcIssuer) {
        try {
          const discoveryUrl = `${provider.oidcIssuer.replace(/\/$/, '')}/.well-known/openid-configuration`;
          const response = await fetch(discoveryUrl, {
            signal: AbortSignal.timeout(5000),
          });
          const isValid = response.ok;
          let message = `Discovery endpoint responded with status ${response.status}`;
          if (isValid) {
            const config = await response.json();
            message = `Discovery OK - Authorization endpoint: ${config.authorization_endpoint || 'not found'}`;
          }
          checks.push({
            name: 'OIDC Discovery',
            passed: isValid,
            message,
          });
        } catch {
          checks.push({
            name: 'OIDC Discovery',
            passed: false,
            message: 'OIDC discovery endpoint is unreachable',
          });
        }
      } else {
        checks.push({
          name: 'OIDC Discovery',
          passed: false,
          message: 'No issuer URL configured',
        });
      }

      // Check client ID is set
      checks.push({
        name: 'Client ID',
        passed: !!provider.oidcClientId,
        message: provider.oidcClientId
          ? 'Client ID is configured'
          : 'No client ID configured',
      });

      // Check client secret is set
      checks.push({
        name: 'Client Secret',
        passed: !!provider.oidcClientSecret,
        message: provider.oidcClientSecret
          ? 'Client secret is configured'
          : 'No client secret configured',
      });
    }

    return {
      success: checks.every((c) => c.passed),
      checks,
    };
  }
}
