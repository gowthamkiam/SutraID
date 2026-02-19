import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    requestMagicLink: jest.fn(),
    verifyMagicLink: jest.fn(),
    registerWithPassword: jest.fn(),
    loginWithPassword: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    revokeSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestMagicLink', () => {
    it('should request magic link', async () => {
      const dto = { email: 'test@example.com' };
      mockAuthService.requestMagicLink.mockResolvedValue({
        message: 'Magic link sent',
      });

      const result = await controller.requestMagicLink(dto);

      expect(result.message).toContain('Magic link sent');
      expect(authService.requestMagicLink).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('verifyMagicLink', () => {
    it('should verify magic link and return auth response', async () => {
      const dto = { token: 'test-token' };
      const authResponse = {
        user: { id: 'user-1', email: 'test@example.com' },
        accessToken: 'jwt-token',
      };

      mockAuthService.verifyMagicLink.mockResolvedValue(authResponse as any);

      const result = await controller.verifyMagicLink(dto);

      expect(result).toEqual(authResponse);
      expect(authService.verifyMagicLink).toHaveBeenCalledWith(dto.token);
    });
  });

  describe('register', () => {
    it('should register user with password', async () => {
      const dto = { email: 'test@example.com', password: 'Password123!' };
      const authResponse = {
        user: { id: 'user-1', email: dto.email },
        accessToken: 'jwt-token',
      };

      mockAuthService.registerWithPassword.mockResolvedValue(
        authResponse as any,
      );

      const result = await controller.register(dto);

      expect(result).toEqual(authResponse);
      expect(authService.registerWithPassword).toHaveBeenCalledWith(
        dto.email,
        dto.password,
      );
    });
  });

  describe('login', () => {
    it('should login user with password', async () => {
      const dto = { email: 'test@example.com', password: 'Password123!', organizationId: 'org-1' };
      const authResponse = {
        user: { id: 'user-1', email: dto.email },
        accessToken: 'jwt-token',
      };

      mockAuthService.loginWithPassword.mockResolvedValue(authResponse as any);

      const res = {
        cookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;
      const result = await controller.login(dto, res);

      expect(result).toEqual(authResponse);
      expect(authService.loginWithPassword).toHaveBeenCalledWith(
        dto.email,
        dto.password,
        dto.organizationId,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should request password reset', async () => {
      const dto = { email: 'test@example.com' };
      mockAuthService.requestPasswordReset.mockResolvedValue({
        message: 'Password reset email sent',
      });

      const result = await controller.forgotPassword(dto);

      expect(result.message).toContain('reset email sent');
      expect(authService.requestPasswordReset).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with token', async () => {
      const dto = { token: 'reset-token', newPassword: 'NewPassword123!' };
      mockAuthService.resetPassword.mockResolvedValue({
        message: 'Password reset successfully',
      });

      const result = await controller.resetPassword(dto);

      expect(result.message).toContain('reset successfully');
      expect(authService.resetPassword).toHaveBeenCalledWith(
        dto.token,
        dto.newPassword,
      );
    });
  });

  describe('changePassword', () => {
    it('should change password for authenticated user', async () => {
      const dto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };
      const req = { user: { id: 'user-1' } };

      mockAuthService.changePassword.mockResolvedValue({
        message: 'Password changed successfully',
      });

      const result = await controller.changePassword(req, dto);

      expect(result.message).toContain('changed successfully');
      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-1',
        dto.currentPassword,
        dto.newPassword,
      );
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      const req = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
      };

      const result = await controller.getMe(req);

      expect(result.user).toEqual(req.user);
    });
  });

  describe('logout', () => {
    it('should logout user and revoke session', async () => {
      const req = { user: { id: 'user-1', jti: 'jti-1' } };
      mockAuthService.revokeSession.mockResolvedValue(undefined);

      const res = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any; // Mock response object
      const result = await controller.logout(req, res);

      expect(result.message).toContain('Logged out successfully');
      expect(authService.revokeSession).toHaveBeenCalledWith('jti-1');
      expect(res.clearCookie).toHaveBeenCalledWith('access_token', { path: '/' });
    });
  });
});
