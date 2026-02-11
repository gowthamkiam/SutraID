import * as saml from 'samlify';
import { User } from '@prisma/client';

export interface SamlAssertionOptions {
  user: User;
  audience: string; // SP Entity ID
  recipient: string; // ACS URL
  destination: string; // ACS URL
  issuer: string; // IDP Entity ID
  nameIdFormat?: string;
  attributes?: Record<string, string | string[]>;
  sessionIndex?: string;
  authnContextClassRef?: string;
  notBefore?: Date;
  notOnOrAfter?: Date;
}

export class SamlAssertionBuilder {
  /**
   * Build a SAML assertion for the authenticated user
   */
  static buildAssertion(options: SamlAssertionOptions): string {
    const {
      user,
      audience,
      recipient,
      destination,
      issuer,
      nameIdFormat = 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      attributes = {},
      sessionIndex = this.generateSessionIndex(),
      authnContextClassRef = 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
      notBefore = new Date(),
      notOnOrAfter = new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    } = options;

    // Build default attributes if not provided
    const defaultAttributes = {
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      userId: user.id,
      ...attributes,
    };

    // Convert attributes to SAML format
    const attributeStatements = Object.entries(defaultAttributes).map(
      ([name, value]) => ({
        name,
        valueXsiType: 'xs:string',
        value: Array.isArray(value) ? value : [value],
      }),
    );

    const assertionTemplate = {
      issuer,
      subject: {
        nameID: user.email,
        nameIDFormat: nameIdFormat,
        subjectConfirmation: [
          {
            method: 'urn:oasis:names:tc:SAML:2.0:cm:bearer',
            subjectConfirmationData: {
              notBefore: notBefore.toISOString(),
              notOnOrAfter: notOnOrAfter.toISOString(),
              recipient,
              inResponseTo: '', // Will be filled by the service
            },
          },
        ],
      },
      conditions: {
        notBefore: notBefore.toISOString(),
        notOnOrAfter: notOnOrAfter.toISOString(),
        audienceRestriction: [audience],
      },
      authnStatement: {
        authnInstant: new Date().toISOString(),
        sessionIndex,
        authnContext: {
          authnContextClassRef,
        },
      },
      attributeStatement: attributeStatements,
    };

    return JSON.stringify(assertionTemplate);
  }

  /**
   * Build attribute mapping based on SP requirements
   */
  static mapAttributes(
    user: User,
    attributeMapping?: Record<string, string>,
  ): Record<string, string | string[]> {
    const defaultMapping = {
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      userId: user.id,
    };

    if (!attributeMapping) {
      return defaultMapping;
    }

    // Apply custom attribute mapping
    const mappedAttributes: Record<string, string | string[]> = {};

    for (const [spAttribute, idpAttribute] of Object.entries(attributeMapping)) {
      const value = (defaultMapping as any)[idpAttribute];
      if (value !== undefined) {
        mappedAttributes[spAttribute] = value;
      }
    }

    return mappedAttributes;
  }

  /**
   * Generate a unique session index
   */
  private static generateSessionIndex(): string {
    return `_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Validate assertion parameters
   */
  static validateAssertionOptions(options: SamlAssertionOptions): void {
    if (!options.user || !options.user.email) {
      throw new Error('User with email is required for SAML assertion');
    }

    if (!options.audience) {
      throw new Error('Audience (SP Entity ID) is required');
    }

    if (!options.recipient || !options.destination) {
      throw new Error('Recipient and destination (ACS URL) are required');
    }

    if (!options.issuer) {
      throw new Error('Issuer (IDP Entity ID) is required');
    }
  }

  /**
   * Build NameID based on format
   */
  static buildNameId(
    user: User,
    format: string = 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  ): { value: string; format: string } {
    let value: string;

    switch (format) {
      case 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress':
        value = user.email;
        break;
      case 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent':
        // Use user ID as persistent identifier
        value = user.id;
        break;
      case 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient':
        // Generate transient identifier
        value = `_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        break;
      case 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified':
        value = user.email;
        break;
      default:
        value = user.email;
    }

    return { value, format };
  }
}
