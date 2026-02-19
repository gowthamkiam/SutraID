import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import {
  MagicLinkRequestDto,
  VerifyMagicLinkDto,
  AuthResponseDto,
  RegisterPasswordDto,
  LoginPasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from '../dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/v1/auth/magic-link
   * Request a magic link to be sent to email
   */
  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  async requestMagicLink(
    @Body() dto: MagicLinkRequestDto,
  ): Promise<{ message: string }> {
    return await this.authService.requestMagicLink(dto.email);
  }

  /**
   * POST /api/v1/auth/verify
   * Verify magic link token and get access token
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyMagicLink(
    @Body() dto: VerifyMagicLinkDto,
  ): Promise<AuthResponseDto> {
    return await this.authService.verifyMagicLink(dto.token);
  }

  /**
   * POST /api/v1/auth/register
   * Register with email and password
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterPasswordDto,
  ): Promise<AuthResponseDto> {
    return await this.authService.registerWithPassword(dto.email, dto.password);
  }

  /**
   * POST /api/v1/auth/login
   * Login with email and password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.loginWithPassword(dto.email, dto.password, dto.organizationId);
    if (result.accessToken && !result.mfaRequired) {
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });
    }
    return result;
  }

  /**
   * POST /api/v1/auth/forgot-password
   * Request a password reset email
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return await this.authService.requestPasswordReset(dto.email);
  }

  /**
   * POST /api/v1/auth/reset-password
   * Reset password with token
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return await this.authService.resetPassword(dto.token, dto.newPassword);
  }

  /**
   * POST /api/v1/auth/change-password
   * Change password (authenticated)
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: any,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return await this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }

  /**
   * GET /api/v1/auth/me
   * Get current authenticated user
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return {
      user: req.user,
    };
  }

  /**
   * POST /api/v1/auth/logout
   * Revoke current session
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.revokeSession(req.user.jti);
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }
}
