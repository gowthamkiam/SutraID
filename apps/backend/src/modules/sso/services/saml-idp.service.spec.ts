/**
 * SAML IdP Service Tests
 *
 * Covers: parseAuthnRequest, createSamlResponse, getIdpMetadata,
 * verifyUserAccess, certificate management, encryption, caching.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { SamlIdpService } from './saml-idp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

// ── Mock samlify ────────────────────────────────────────────────────────
// All mocks defined inline inside jest.mock factories to avoid TDZ issues.
// References captured via require() after mocking.
jest.mock('samlify', () => {
  const idpInstance = {
    getMetadata: jest.fn().mockReturnValue('<EntityDescriptor>mock-metadata</EntityDescriptor>'),
    parseLoginRequest: jest.fn(),
    createLoginResponse: jest.fn(),
  };
  return {
    __idpInstance: idpInstance,
    IdentityProvider: jest.fn().mockReturnValue(idpInstance),
    ServiceProvider: jest.fn().mockReturnValue({}),
    setSchemaValidator: jest.fn(),
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockIdpInstance = (require('samlify') as any).__idpInstance;

// ── Mock node-forge ─────────────────────────────────────────────────────
jest.mock('node-forge', () => {
  const cert = {
    publicKey: null as any,
    serialNumber: '',
    validity: { notBefore: null as any, notAfter: null as any },
    setSubject: jest.fn(),
    setIssuer: jest.fn(),
    setExtensions: jest.fn(),
    sign: jest.fn(),
  };
  return {
    __cert: cert,
    pki: {
      rsa: {
        generateKeyPair: jest.fn().mockReturnValue({
          publicKey: {},
          privateKey: {},
        }),
      },
      createCertificate: jest.fn().mockReturnValue(cert),
      certificateToPem: jest.fn().mockReturnValue(
        '-----BEGIN CERTIFICATE-----\nmock-cert\n-----END CERTIFICATE-----',
      ),
      privateKeyToPem: jest.fn().mockReturnValue(
        '-----BEGIN RSA PRIVATE KEY-----\nmock-key\n-----END RSA PRIVATE KEY-----',
      ),
    },
    md: { sha256: { create: jest.fn() } },
    util: { bytesToHex: jest.fn().mockReturnValue('abcdef0123456789') },
    random: { getBytesSync: jest.fn().mockReturnValue(Buffer.alloc(8)) },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockCert = (require('node-forge') as any).__cert;

describe('SamlIdpService', () => {
  let service: SamlIdpService;

  // 64-char hex = 32-byte AES-256 key
  const TEST_ENCRYPTION_KEY = 'a'.repeat(64);

  const mockOrganization = {
    id: '22843968-59d7-4488-9ef2-f9f720945b57',
    name: 'Test Organization',
    slug: 'test-org',
    samlIdpCertificate: null as string | null,
    samlIdpPrivateKey: null as string | null,
  };

  const mockUser = {
    id: 'usr_a1b2c3d4e5f6',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    emailVerified: true,
    updatedAt: new Date(),
  } as any;

  const mockPrismaService = {
    application: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        BACKEND_URL: 'http://localhost:3000',
        ENCRYPTION_KEY: TEST_ENCRYPTION_KEY,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset mock IdP instance between tests
    mockIdpInstance.getMetadata.mockReturnValue('<EntityDescriptor>mock-metadata</EntityDescriptor>');
    mockIdpInstance.parseLoginRequest.mockReset();
    mockIdpInstance.createLoginResponse.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SamlIdpService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SamlIdpService>(SamlIdpService);
  });

  afterEach(() => {
    // Clear IdP cache between tests
    service.clearIdpCache(mockOrganization.id);
  });

  // ── getIdpMetadata ────────────────────────────────────────────────────

  describe('getIdpMetadata', () => {
    it('should return metadata XML from IDP instance', async () => {
      const encryptedKey = (service as any).encryptPrivateKey('some-key');
      mockPrismaService.application.findUnique.mockResolvedValue({
        ...mockOrganization,
        samlCertificate: '-----BEGIN CERTIFICATE-----\nexisting\n-----END CERTIFICATE-----',
        samlPrivateKey: encryptedKey,
      });
      mockPrismaService.application.update.mockResolvedValue({});

      const result = await service.getIdpMetadata(mockOrganization.id);

      expect(result).toContain('EntityDescriptor');
      expect(mockIdpInstance.getMetadata).toHaveBeenCalled();
    });

    it('should throw BadRequestException when organization not found', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.getIdpMetadata('non-existent')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when getMetadata fails', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.update.mockResolvedValue({});
      mockIdpInstance.getMetadata.mockImplementation(() => {
        throw new Error('metadata generation failed');
      });

      await expect(service.getIdpMetadata(mockOrganization.id)).rejects.toThrow(
        'Failed to generate IDP metadata',
      );
    });
  });

  // ── parseAuthnRequest ─────────────────────────────────────────────────

  describe('parseAuthnRequest', () => {
    beforeEach(() => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.update.mockResolvedValue({});
    });

    it('should extract id, acsUrl, issuer from valid SAMLRequest', async () => {
      mockIdpInstance.parseLoginRequest.mockResolvedValue({
        extract: {
          request: {
            id: '_req123',
            assertionConsumerServiceURL: 'https://sp.example.com/acs',
            issuer: 'https://sp.example.com/entity',
          },
          relayState: 'some-relay-state',
        },
      });

      const result = await service.parseAuthnRequest(
        mockOrganization.id,
        'base64-saml-request',
      );

      expect(result.id).toBe('_req123');
      expect(result.acsUrl).toBe('https://sp.example.com/acs');
      expect(result.issuer).toBe('https://sp.example.com/entity');
      expect(result.relayState).toBe('some-relay-state');
    });

    it('should throw BadRequestException for malformed SAMLRequest', async () => {
      mockIdpInstance.parseLoginRequest.mockRejectedValue(
        new Error('Invalid SAML request'),
      );

      await expect(
        service.parseAuthnRequest(mockOrganization.id, 'invalid-base64'),
      ).rejects.toThrow('Failed to parse SAML AuthnRequest');
    });
  });

  // ── createSamlResponse ────────────────────────────────────────────────

  describe('createSamlResponse', () => {
    beforeEach(() => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.update.mockResolvedValue({});
    });

    it('should generate SAML response with correct parameters', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue({
        samlAttributeMapping: null,
        samlNameIdFormat: null,
      });
      mockIdpInstance.createLoginResponse.mockReturnValue({
        context: 'base64-saml-response',
      });

      const result = await service.createSamlResponse(
        mockOrganization.id,
        mockUser,
        '_req123',
        'https://sp.example.com/acs',
        'https://sp.example.com/entity',
        'relay-state-value',
      );

      expect(result.samlResponse).toBe('base64-saml-response');
      expect(result.relayState).toBe('relay-state-value');
      expect(mockIdpInstance.createLoginResponse).toHaveBeenCalled();
    });

    it('should use default emailAddress nameID format when application has no override', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue({
        samlAttributeMapping: null,
        samlNameIdFormat: null,
      });
      mockIdpInstance.createLoginResponse.mockReturnValue({ context: 'response' });

      await service.createSamlResponse(
        mockOrganization.id,
        mockUser,
        '_req123',
        'https://sp.example.com/acs',
        'https://sp.example.com/entity',
      );

      // The custom template builder is called — verify user info was passed
      const callArgs = mockIdpInstance.createLoginResponse.mock.calls[0];
      const templateFn = callArgs[4]; // 5th arg is the template function
      const template = templateFn();
      expect(template.nameID).toBe('john@example.com');
      expect(template.nameIDFormat).toBe(
        'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      );
    });

    it('should use application-configured nameID format (persistent)', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue({
        samlAttributeMapping: null,
        samlNameIdFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
      });
      mockIdpInstance.createLoginResponse.mockReturnValue({ context: 'response' });

      await service.createSamlResponse(
        mockOrganization.id,
        mockUser,
        '_req123',
        'https://sp.example.com/acs',
        'https://sp.example.com/entity',
      );

      const callArgs = mockIdpInstance.createLoginResponse.mock.calls[0];
      const template = callArgs[4]();
      expect(template.nameID).toBe('usr_a1b2c3d4e5f6');
      expect(template.nameIDFormat).toBe(
        'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
      );
    });

    it('should throw BadRequestException when createLoginResponse fails', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue({
        samlAttributeMapping: null,
        samlNameIdFormat: null,
      });
      mockIdpInstance.createLoginResponse.mockImplementation(() => {
        throw new Error('signing failed');
      });

      await expect(
        service.createSamlResponse(
          mockOrganization.id,
          mockUser,
          '_req123',
          'https://sp.example.com/acs',
          'https://sp.example.com/entity',
        ),
      ).rejects.toThrow('Failed to create SAML Response');
    });

    it('should handle missing application gracefully (no custom attribute mapping)', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue(null);
      mockIdpInstance.createLoginResponse.mockReturnValue({ context: 'response' });

      const result = await service.createSamlResponse(
        mockOrganization.id,
        mockUser,
        '_req123',
        'https://sp.example.com/acs',
        'https://sp.example.com/entity',
      );

      expect(result.samlResponse).toBe('response');
    });
  });

  // ── verifyUserAccess ──────────────────────────────────────────────────

  describe('verifyUserAccess', () => {
    it('should return true for active SAML application matching spEntityId', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue({ id: 'app-1' });

      const result = await service.verifyUserAccess(
        mockUser,
        mockOrganization.id,
        'https://sp.example.com/entity',
      );

      expect(result).toBe(true);
    });

    it('should return false when no matching application found', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue(null);

      const result = await service.verifyUserAccess(
        mockUser,
        mockOrganization.id,
        'https://unknown-sp.com',
      );

      expect(result).toBe(false);
    });

    it('should query with correct filters (type=SAML, status=ACTIVE)', async () => {
      mockPrismaService.application.findFirst.mockResolvedValue(null);

      await service.verifyUserAccess(
        mockUser,
        mockOrganization.id,
        'https://sp.example.com/entity',
      );

      expect(mockPrismaService.application.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockOrganization.id,
          samlSpEntityId: 'https://sp.example.com/entity',
          type: 'SAML',
          status: 'ACTIVE',
        },
      });
    });
  });

  // ── clearIdpCache ─────────────────────────────────────────────────────

  describe('clearIdpCache', () => {
    it('should force recreation of IDP instance on next call', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(mockOrganization);
      mockPrismaService.application.update.mockResolvedValue({});

      // First call creates and caches
      await service.getIdpMetadata(mockOrganization.id);
      const firstCallCount = mockPrismaService.application.findUnique.mock.calls.length;

      // Clear cache
      service.clearIdpCache(mockOrganization.id);

      // Second call should re-create
      await service.getIdpMetadata(mockOrganization.id);
      expect(mockPrismaService.application.findUnique.mock.calls.length).toBeGreaterThan(firstCallCount);
    });
  });

  // ── Certificate management (private methods via casting) ──────────────

  describe('getOrCreateIdpCertificate', () => {
    it('should generate new certificate when none exists in database', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        samlCertificate: null,
        samlPrivateKey: null,
      });
      mockPrismaService.application.update.mockResolvedValue({});

      const result = await (service as any).getOrCreateIdpCertificate(mockOrganization.id);

      expect(result.certificate).toContain('BEGIN CERTIFICATE');
      expect(result.privateKey).toContain('BEGIN RSA PRIVATE KEY');
      expect(mockPrismaService.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockOrganization.id },
          data: expect.objectContaining({
            samlCertificate: expect.stringContaining('BEGIN CERTIFICATE'),
          }),
        }),
      );
    });

    it('should return existing certificate when present in database', async () => {
      const encryptedKey = (service as any).encryptPrivateKey('mock-private-key');
      mockPrismaService.application.findUnique.mockResolvedValue({
        samlCertificate: '-----BEGIN CERTIFICATE-----\nexisting\n-----END CERTIFICATE-----',
        samlPrivateKey: encryptedKey,
      });

      const result = await (service as any).getOrCreateIdpCertificate(mockOrganization.id);

      expect(result.certificate).toContain('existing');
      expect(result.privateKey).toBe('mock-private-key');
      expect(mockPrismaService.application.update).not.toHaveBeenCalled();
    });
  });

  // ── Encryption helpers ────────────────────────────────────────────────

  describe('encryption helpers', () => {
    it('should encrypt and decrypt private key round-trip', () => {
      const original = '-----BEGIN RSA PRIVATE KEY-----\ntest-key-data\n-----END RSA PRIVATE KEY-----';

      const encrypted = (service as any).encryptPrivateKey(original);
      expect(encrypted).not.toBe(original);

      const parsed = JSON.parse(encrypted);
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('authTag');

      const decrypted = (service as any).decryptPrivateKey(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should throw when ENCRYPTION_KEY is not configured', () => {
      mockConfigService.get.mockReturnValue(null as any);

      expect(() => (service as any).encryptPrivateKey('test')).toThrow(
        'ENCRYPTION_KEY not configured',
      );
    });

    it('should throw when decrypting with missing ENCRYPTION_KEY', () => {
      // First encrypt with valid key
      mockConfigService.get.mockReturnValue(TEST_ENCRYPTION_KEY);
      const encrypted = (service as any).encryptPrivateKey('test');

      // Then try to decrypt without key
      mockConfigService.get.mockReturnValue(null as any);
      expect(() => (service as any).decryptPrivateKey(encrypted)).toThrow(
        'ENCRYPTION_KEY not configured',
      );
    });
  });
});
