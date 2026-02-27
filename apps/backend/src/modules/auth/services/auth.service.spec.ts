import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../audit/audit.service';
import { MfaService } from './mfa.service';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let configService: jest.Mocked<ConfigService>;
  let auditService: jest.Mocked<AuditService>;
  let mfaService: jest.Mocked<MfaService>;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    authChallenge: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    directoryConfig: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        RESEND_API_KEY: 'test-resend-key',
        FRONTEND_URL: 'http://localhost:3001',
        EMAIL_FROM: 'test@example.com',
      };
      return config[key];
    }),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockMfaService = {
    createMfaToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: MfaService,
          useValue: mockMfaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    configService = module.get(ConfigService);
    auditService = module.get(AuditService);
    mfaService = module.get(MfaService);

    mockPrismaService.directoryConfig.findFirst.mockResolvedValue(null as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestMagicLink', () => {
    it('should throw NotFoundException for new email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.requestMagicLink('unknown@example.com'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockPrismaService.authChallenge.create).not.toHaveBeenCalled();
    });


    it('should send magic link for existing user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        status: 'ACTIVE',
      } as any);
      mockPrismaService.authChallenge.create.mockResolvedValue({} as any);

      const result = await service.requestMagicLink('test@example.com');

      expect(result.message).toContain('Magic link sent');
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user suspended', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        status: 'SUSPENDED',
      } as any);

      await expect(
        service.requestMagicLink('test@example.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerWithPassword', () => {
    it('should register new user with password', async () => {
      const bcrypt = require('bcrypt');
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        status: 'ACTIVE',
      } as any);
      mockPrismaService.session.create.mockResolvedValue({
        id: 'session-1',
        jti: 'jti-1',
      } as any);

      const result = await service.registerWithPassword(
        'test@example.com',
        'Password123!',
      );

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
    });

    it('should throw BadRequestException if user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'existing_hash',
      } as any);

      await expect(
        service.registerWithPassword('test@example.com', 'Password123!'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('loginWithPassword', () => {
    it('should login user with correct credentials', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(true);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
      } as any);
      mockPrismaService.session.create.mockResolvedValue({
        id: 'session-1',
        jti: 'jti-1',
      } as any);

      const result = await service.loginWithPassword(
        'test@example.com',
        'Password123!',
      );

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.login',
        }),
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        status: 'ACTIVE',
      } as any);
      mockAuditService.log.mockResolvedValue(undefined);

      await expect(
        service.loginWithPassword('test@example.com', 'WrongPassword'),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockAuditService.log.mockResolvedValue(undefined);

      await expect(
        service.loginWithPassword('test@example.com', 'Password123!'),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password not set', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: null,
        status: 'ACTIVE',
      } as any);

      await expect(
        service.loginWithPassword('test@example.com', 'Password123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if user suspended', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        status: 'SUSPENDED',
      } as any);

      await expect(
        service.loginWithPassword('test@example.com', 'Password123!'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(true);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'old_hashed_password',
      } as any);
      mockPrismaService.user.update.mockResolvedValue({} as any);

      const result = await service.changePassword(
        'user-1',
        'OldPassword123!',
        'NewPassword123!',
      );

      expect(result.message).toContain('changed successfully');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for wrong current password', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare.mockResolvedValue(false);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
      } as any);

      await expect(
        service.changePassword(
          'user-1',
          'WrongPassword',
          'NewPassword123!',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('requestPasswordReset', () => {
    it('should create password reset challenge', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        status: 'ACTIVE',
      } as any);
      mockPrismaService.authChallenge.create.mockResolvedValue({} as any);

      const result = await service.requestPasswordReset('test@example.com');

      expect(result.message).toContain('reset link has been sent');
      expect(mockPrismaService.authChallenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'PASSWORD_RESET',
          }),
        }),
      );
    });

    it('should return success even if user not found (security)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset('unknown@example.com');

      expect(result.message).toBeDefined();
      expect(mockPrismaService.authChallenge.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const bcrypt = require('bcrypt');
      mockPrismaService.authChallenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        userId: 'user-1',
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() + 10000),
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
      } as any);
      mockPrismaService.authChallenge.update.mockResolvedValue({} as any);
      mockPrismaService.user.update.mockResolvedValue({} as any);

      const result = await service.resetPassword('token123', 'NewPassword123!');

      expect(result.message).toContain('reset successfully');
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 12);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockPrismaService.authChallenge.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'NewPassword123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      mockPrismaService.authChallenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        userId: 'user-1',
        type: 'PASSWORD_RESET',
        expiresAt: new Date(Date.now() - 10000),
      } as any);

      await expect(
        service.resetPassword('expired-token', 'NewPassword123!'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeSession', () => {
    it('should revoke session successfully', async () => {
      mockPrismaService.session.updateMany.mockResolvedValue({} as any);

      await service.revokeSession('jti-1');

      expect(mockPrismaService.session.updateMany).toHaveBeenCalled();
    });
  });
});
