import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import {
  MagicLinkRequestDto,
  VerifyMagicLinkDto,
  AuthResponseDto,
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
  async logout(@Request() req: any): Promise<{ message: string }> {
    await this.authService.revokeSession(req.user.jti);
    return { message: 'Logged out successfully' };
  }
}
