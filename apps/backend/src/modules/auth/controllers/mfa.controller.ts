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
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { MfaService } from '../services/mfa.service';
import { AuthService } from '../services/auth.service';
import {
  VerifyTotpEnrollmentDto,
  VerifyMfaChallengeDto,
  DisableMfaDto,
} from '../dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth/mfa')
export class MfaController {
  constructor(
    private mfaService: MfaService,
    private authService: AuthService,
  ) { }

  /**
   * GET /api/v1/auth/mfa/status
   * Get current user's MFA status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Request() req: any) {
    return this.mfaService.getMfaStatus(req.user.id);
  }

  /**
   * POST /api/v1/auth/mfa/enroll/totp
   * Start TOTP enrollment — returns QR code + backup codes
   */
  @Post('enroll/totp')
  @UseGuards(JwtAuthGuard)
  async enrollTotp(@Request() req: any) {
    return this.mfaService.enrollTotp(req.user.id);
  }

  /**
   * POST /api/v1/auth/mfa/enroll/verify
   * Verify TOTP enrollment with first code
   */
  @Post('enroll/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyEnrollment(
    @Request() req: any,
    @Body() dto: VerifyTotpEnrollmentDto,
  ) {
    return this.mfaService.verifyTotpEnrollment(req.user.id, dto.methodId, dto.code);
  }

  /**
   * POST /api/v1/auth/mfa/verify-challenge
   * Verify MFA code during login (no auth guard — uses mfaToken)
   */
  @Post('verify-challenge')
  @HttpCode(HttpStatus.OK)
  async verifyChallenge(
    @Body() dto: VerifyMfaChallengeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Verify the temporary MFA token
    const { userId } = await this.mfaService.verifyMfaToken(dto.mfaToken);

    // Verify TOTP or backup code
    let isValid: boolean;
    if (dto.isBackupCode) {
      isValid = await this.mfaService.verifyBackupCode(userId, dto.code);
    } else {
      isValid = await this.mfaService.verifyTotpCode(userId, dto.code);
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid authentication code');
    }

    // MFA verified — create full session
    const user = await this.authService.getUserById(userId);
    const session = await this.authService.createSessionForUser(user);
    if (session.accessToken) {
      res.cookie('access_token', session.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });
    }
    return session;
  }

  /**
   * POST /api/v1/auth/mfa/backup-codes/regenerate
   * Regenerate backup codes
   */
  @Post('backup-codes/regenerate')
  @UseGuards(JwtAuthGuard)
  async regenerateBackupCodes(@Request() req: any) {
    return this.mfaService.regenerateBackupCodes(req.user.id);
  }

  /**
   * POST /api/v1/auth/mfa/disable
   * Disable MFA (requires password confirmation)
   */
  @Post('disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable(@Request() req: any, @Body() dto: DisableMfaDto) {
    return this.mfaService.disableTotp(req.user.id, dto.password);
  }

  @Get('passkey/options')
  @UseGuards(JwtAuthGuard)
  async getPasskeyOptions(@Request() req: any) {
    return this.mfaService.getPasskeyOptions(req.user.id);
  }

  @Post('passkey/enroll')
  @UseGuards(JwtAuthGuard)
  async enrollPasskey(@Request() req: any, @Body() body: any) {
    return this.mfaService.enrollPasskey(req.user.id, body.credential);
  }

  @Post('adaptive/toggle')
  @UseGuards(JwtAuthGuard)
  async toggleAdaptiveAuth(@Request() req: any, @Body() body: { enabled: boolean }) {
    return this.mfaService.toggleAdaptiveAuth(req.user.id, body.enabled);
  }
}
