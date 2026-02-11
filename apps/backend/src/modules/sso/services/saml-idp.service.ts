import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as saml from 'samlify';
import { SamlAssertionBuilder } from '../utils/saml-assertion-builder';
import { User } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class SamlIdpService {
  private idpInstances: Map<string, any> = new Map();

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /**
   * Get or create SAML Identity Provider instance for an organization
   */
  private async getIdpInstance(organizationId: string) {
    // Check cache
    if (this.idpInstances.has(organizationId)) {
      return this.idpInstances.get(organizationId);
    }

    // Get organization
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    // Get or generate IDP certificate and private key
    const { certificate, privateKey } = await this.getOrCreateIdpCertificate(
      organizationId,
    );

    const baseUrl = this.config.get<string>('BACKEND_URL') || 'http://localhost:3000';
    const entityId = `${baseUrl}/api/v1/sso/saml-idp/${organizationId}/metadata`;
    const ssoUrl = `${baseUrl}/api/v1/sso/saml-idp/${organizationId}/sso`;

    // Create Identity Provider instance
    const idp = saml.IdentityProvider({
      entityID: entityId,
      signingCert: certificate,
      privateKey: privateKey,
      nameIDFormat: ['urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'],
      singleSignOnService: [
        {
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
          Location: ssoUrl,
        },
        {
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
          Location: ssoUrl,
        },
      ],
      wantAuthnRequestsSigned: false,
      requestSignatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
    });

    // Cache the instance
    this.idpInstances.set(organizationId, idp);

    return idp;
  }

  /**
   * Get or create IDP certificate and private key for signing
   */
  private async getOrCreateIdpCertificate(organizationId: string): Promise<{
    certificate: string;
    privateKey: string;
  }> {
    // Check if certificate exists in database
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { samlIdpCertificate: true, samlIdpPrivateKey: true },
    });

    if (org?.samlIdpCertificate && org?.samlIdpPrivateKey) {
      // Decrypt private key from database
      const decryptedPrivateKey = this.decryptPrivateKey(org.samlIdpPrivateKey);
      return {
        certificate: org.samlIdpCertificate,
        privateKey: decryptedPrivateKey,
      };
    }

    // Generate new certificate and private key
    const { certificate, privateKey } = await this.generateSelfSignedCertificate();

    // Encrypt and store in database
    const encryptedPrivateKey = this.encryptPrivateKey(privateKey);

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        samlIdpCertificate: certificate,
        samlIdpPrivateKey: encryptedPrivateKey,
      },
    });

    return { certificate, privateKey };
  }

  /**
   * Generate self-signed certificate for SAML signing
   */
  private async generateSelfSignedCertificate(): Promise<{
    certificate: string;
    privateKey: string;
  }> {
    // Generate RSA key pair
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    // For now, return the public key as certificate
    // In production, you should use proper X.509 certificate generation
    // with libraries like `node-forge` or `pem`
    const certificate = publicKey;

    return { certificate, privateKey };
  }

  /**
   * Encrypt private key before storing in database
   */
  private encryptPrivateKey(privateKey: string): string {
    const encryptionKey = this.config.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY not configured');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(encryptionKey, 'hex'),
      iv,
    );

    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex'),
    });
  }

  /**
   * Decrypt private key from database
   */
  private decryptPrivateKey(encryptedData: string): string {
    const encryptionKey = this.config.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY not configured');
    }

    const { iv, data, authTag } = JSON.parse(encryptedData);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(encryptionKey, 'hex'),
      Buffer.from(iv, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Parse incoming SAML AuthnRequest from SP
   */
  async parseAuthnRequest(
    organizationId: string,
    samlRequest: string,
  ): Promise<{
    id: string;
    acsUrl: string;
    issuer: string;
    relayState?: string;
  }> {
    const idp = await this.getIdpInstance(organizationId);

    try {
      // Parse the SAML request
      const { extract } = await idp.parseLoginRequest(
        // Create a mock Service Provider for parsing
        saml.ServiceProvider({
          entityID: 'unknown',
          assertionConsumerService: [{
            Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            Location: 'unknown',
          }],
        }),
        'redirect',
        { query: { SAMLRequest: samlRequest } },
      );

      return {
        id: extract.request.id,
        acsUrl: extract.request.assertionConsumerServiceURL,
        issuer: extract.request.issuer,
        relayState: extract.relayState,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to parse SAML AuthnRequest: ${error.message}`,
      );
    }
  }

  /**
   * Create SAML Response for authenticated user
   */
  async createSamlResponse(
    organizationId: string,
    user: User,
    authnRequestId: string,
    acsUrl: string,
    spEntityId: string,
    relayState?: string,
  ): Promise<{ samlResponse: string; relayState?: string }> {
    const idp = await this.getIdpInstance(organizationId);

    const baseUrl = this.config.get<string>('BACKEND_URL') || 'http://localhost:3000';
    const issuer = `${baseUrl}/api/v1/sso/saml-idp/${organizationId}/metadata`;

    // Get application configuration for attribute mapping
    const application = await this.prisma.application.findFirst({
      where: {
        organizationId,
        samlSpEntityId: spEntityId,
      },
    });

    // Build attributes
    const attributes = SamlAssertionBuilder.mapAttributes(
      user,
      application?.samlAttributeMapping as Record<string, string> | undefined,
    );

    // Build NameID
    const nameIdFormat = application?.samlNameIdFormat ||
      'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';
    const nameId = SamlAssertionBuilder.buildNameId(user, nameIdFormat);

    try {
      // Create Service Provider instance for the requesting SP
      const sp = saml.ServiceProvider({
        entityID: spEntityId,
        assertionConsumerService: [{
          Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
          Location: acsUrl,
        }],
      });

      // Create login response
      const { context } = idp.createLoginResponse(
        sp,
        null, // request info (we already have it)
        'post',
        {
          user: {
            email: user.email,
            name: nameId.value,
          },
        },
        () => ({
          id: `_${crypto.randomBytes(16).toString('hex')}`,
          issuer,
          destination: acsUrl,
          audience: spEntityId,
          nameID: nameId.value,
          nameIDFormat: nameId.format,
          recipient: acsUrl,
          inResponseTo: authnRequestId,
          authnContextClassRef: 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
          attributes,
        }),
      );

      return {
        samlResponse: context,
        relayState,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to create SAML Response: ${error.message}`,
      );
    }
  }

  /**
   * Get IDP metadata XML
   */
  async getIdpMetadata(organizationId: string): Promise<string> {
    const idp = await this.getIdpInstance(organizationId);

    try {
      return idp.getMetadata();
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to generate IDP metadata: ${error.message}`,
      );
    }
  }

  /**
   * Verify that the user is authenticated and has access to the application
   */
  async verifyUserAccess(
    user: User,
    organizationId: string,
    spEntityId: string,
  ): Promise<boolean> {
    // Check if application exists and is enabled
    const application = await this.prisma.application.findFirst({
      where: {
        organizationId,
        samlSpEntityId: spEntityId,
        samlIdpEnabled: true,
        status: 'ACTIVE',
      },
    });

    if (!application) {
      return false;
    }

    // TODO: Add additional access checks (user role, group membership, etc.)

    return true;
  }

  /**
   * Clear cached IDP instance (for testing or when certificate is rotated)
   */
  clearIdpCache(organizationId: string): void {
    this.idpInstances.delete(organizationId);
  }
}
