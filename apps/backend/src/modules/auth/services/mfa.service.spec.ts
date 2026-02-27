import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SignJWT } from 'jose';
import { MfaService } from './mfa.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../audit/audit.service';

describe('MfaService', () => {
  let service: MfaService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    mfaMethod: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        MFA_ENCRYPTION_KEY:
          '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      };
      return config[key];
    }),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<MfaService>(MfaService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMfaToken / verifyMfaToken', () => {
    it('should create and verify MFA challenge token', async () => {
      const token = await service.createMfaToken('user-1');
      const result = await service.verifyMfaToken(token);

      expect(result).toEqual({ userId: 'user-1' });
    });

    it('should reject token with wrong type', async () => {
      const jwtSecret = new TextEncoder().encode('test-secret');
      const token = await new SignJWT({
        sub: 'user-1',
        type: 'access',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(jwtSecret);

      await expect(service.verifyMfaToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getMfaStatus', () => {
    it('should return MFA status and method summaries', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        mfaEnabled: true,
        mfaMethods: [
          {
            id: 'method-1',
            type: 'TOTP',
            name: 'Authenticator App',
            verified: true,
            lastUsedAt: new Date('2025-01-01T00:00:00.000Z'),
            backupCodes: ['a', 'b', 'c'],
          },
        ],
      } as any);

      const result = await service.getMfaStatus('user-1');

      expect(result.enabled).toBe(true);
      expect(result.methods[0]).toEqual(
        expect.objectContaining({
          id: 'method-1',
          type: 'TOTP',
          backupCodesRemaining: 3,
        }),
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMfaStatus('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPasskeyOptions', () => {
    it('should return registration options for a valid user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      } as any);
      mockPrismaService.mfaMethod.findMany.mockResolvedValue([]);

      const result = await service.getPasskeyOptions('user-1');
      expect(result).toHaveProperty('challenge');
      expect(result).toHaveProperty('rp');
      expect(result.rp.name).toBe('SutraID');
    });
  });
});
