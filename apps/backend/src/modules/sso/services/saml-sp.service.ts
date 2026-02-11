import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SsoService } from '../sso.service';
import { SAML, SamlConfig } from '@node-saml/passport-saml';
import * as crypto from 'crypto';

@Injectable()
export class SamlSpService {
  constructor(
    private prisma: PrismaService,
    private ssoService: SsoService,
  ) {}

  /**
   * Get SAML configuration for a provider
   */
  private async getSamlConfig(providerId: string): Promise<SamlConfig> {
    const provider = await this.ssoService.getProviderWithSecrets(providerId);

    if (!provider.samlEntityId || !provider.samlSsoUrl) {
      throw new BadRequestException('Invalid SAML configuration');
    }

    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const acsUrl = `${baseUrl}/api/v1/sso/saml/${provider.organizationId}/acs`;

    return {
      // IdP Configuration
      entryPoint: provider.samlSsoUrl,
      issuer: provider.samlEntityId,
      idpCert: provider.samlCertificate || '', // IdP certificate

      // SP Configuration
      callbackUrl: acsUrl,
      audience: provider.samlEntityId,

      // Security
      wantAssertionsSigned: true,
      signatureAlgorithm: 'sha256',

      // Attribute mapping
      identifierFormat:
        'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
    };
  }

  /**
   * Generate SAML login URL
   */
  async getLoginUrl(providerId: string, relayState?: string): Promise<string> {
    const config = await this.getSamlConfig(providerId);
    const saml = new SAML(config);

    try {
      const loginUrl = await saml.getAuthorizeUrlAsync(
        relayState || '',
        undefined,
        {},
      );
      return loginUrl;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to generate SAML login URL: ${error.message}`,
      );
    }
  }

  /**
   * Validate SAML response and extract user profile
   */
  async validateSamlResponse(
    providerId: string,
    body: any,
  ): Promise<{
    externalId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    attributes: any;
  }> {
    const config = await this.getSamlConfig(providerId);
    const saml = new SAML(config);

    try {
      const { profile } = await saml.validatePostResponseAsync(body);

      if (!profile) {
        throw new BadRequestException('No profile returned from SAML response');
      }

      // Extract user data from SAML profile (with type assertions)
      const externalId = (profile.nameID || profile.subject) as string;
      const email = (profile.email ||
        profile[
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
        ]) as string;

      if (!externalId || !email) {
        throw new BadRequestException(
          'SAML response missing required attributes',
        );
      }

      return {
        externalId,
        email,
        firstName:
          (profile.firstName ||
            profile[
              'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'
            ]) as string | undefined,
        lastName:
          (profile.lastName ||
            profile[
              'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'
            ]) as string | undefined,
        attributes: profile,
      };
    } catch (error: any) {
      throw new BadRequestException(`SAML validation failed: ${error.message}`);
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
        firstName: attributes.firstName,
        lastName: attributes.lastName,
        status: 'ACTIVE',
        lastLoginAt: new Date(),
        ssoIdentities: {
          create: {
            ssoProviderId: providerId,
            externalId,
            externalEmail: email,
            issuer: provider.samlEntityId || provider.oidcIssuer || '',
            attributes,
            firstLoginAt: new Date(),
            lastLoginAt: new Date(),
          },
        },
      },
    });

    return user;
  }

  /**
   * Generate SAML metadata XML
   */
  async getMetadata(organizationId: string): Promise<string> {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const acsUrl = `${baseUrl}/api/v1/sso/saml/${organizationId}/acs`;
    const entityId = `${baseUrl}/api/v1/sso/saml/${organizationId}/metadata`;

    return `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     validUntil="2030-01-01T00:00:00Z"
                     entityID="${entityId}">
  <md:SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true"
                      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:persistent</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                 Location="${acsUrl}"
                                 index="1" />
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  }
}
