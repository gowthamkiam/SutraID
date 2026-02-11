import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Resend } from 'resend';
import { SignJWT } from 'jose';
import * as crypto from 'crypto';
import { AuthResponseDto } from '../dto';

@Injectable()
export class AuthService {
  private resend: Resend;
  private jwtSecret: Uint8Array;
  private frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Initialize Resend client
    const resendApiKey = this.config.get<string>('RESEND_API_KEY');
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
      console.log('✅ Resend initialized successfully');
    } else {
      console.log('⚠️  Resend NOT initialized - magic links will be logged to console');
    }

    // JWT secret
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    this.jwtSecret = new TextEncoder().encode(secret);

    // Frontend URL for magic link
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    console.log(`📧 Email FROM: ${this.config.get<string>('EMAIL_FROM') || 'noreply@sutraid.com'}`);
    console.log(`🌐 Frontend URL: ${this.frontendUrl}`);
  }

  /**
   * Request a magic link to be sent to the user's email
   */
  async requestMagicLink(email: string): Promise<{ message: string }> {
    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Auto-create user on first magic link request
      user = await this.prisma.user.create({
        data: {
          email,
          emailVerified: false,
          status: 'ACTIVE',
        },
      });
    }

    // Check if user is suspended or deleted
    if (user.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Account is not active. Please contact support.',
      );
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Create auth challenge
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await this.prisma.authChallenge.create({
      data: {
        userId: user.id,
        type: 'MAGIC_LINK',
        token: tokenHash,
        identifier: email,
        expiresAt,
      },
    });

    // Send magic link email
    const magicLink = `${this.frontendUrl}/auth/verify?token=${token}`;
    await this.sendMagicLinkEmail(email, magicLink);

    return {
      message: 'Magic link sent! Check your email to continue.',
    };
  }

  /**
   * Verify magic link token and create session
   */
  async verifyMagicLink(token: string): Promise<AuthResponseDto> {
    // Hash the token to match stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find auth challenge
    const challenge = await this.prisma.authChallenge.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!challenge) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    // Check if expired
    if (challenge.expiresAt < new Date()) {
      throw new UnauthorizedException('Magic link has expired');
    }

    // Check if already verified
    if (challenge.verified) {
      throw new BadRequestException('Magic link has already been used');
    }

    // Mark challenge as verified
    await this.prisma.authChallenge.update({
      where: { id: challenge.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    // Mark email as verified if not already
    if (!challenge.user.emailVerified) {
      await this.prisma.user.update({
        where: { id: challenge.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: challenge.userId },
      data: { lastLoginAt: new Date() },
    });

    // Create session and tokens
    return await this.createSession(challenge.user);
  }

  /**
   * Create a new session with access and refresh tokens
   */
  private async createSession(user: any): Promise<AuthResponseDto> {
    const jti = crypto.randomUUID();
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // JWT expiration (15 minutes)
    const expiresIn = 15 * 60; // seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Create access token (JWT)
    const accessToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      type: 'access',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .setJti(jti)
      .sign(this.jwtSecret);

    // Store session in database
    await this.prisma.session.create({
      data: {
        userId: user.id,
        accessToken: jti,
        refreshToken: refreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for refresh
        lastActiveAt: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Send magic link email via Resend
   */
  private async sendMagicLinkEmail(
    email: string,
    magicLink: string,
  ): Promise<void> {
    console.log(`\n📧 Attempting to send magic link to: ${email}`);
    console.log(`🔗 Magic link URL: ${magicLink}`);

    if (!this.resend) {
      // In development without Resend configured, just log the link
      console.log(`⚠️  Resend NOT configured - logging link instead of sending email\n`);
      console.log(`\n🔗 Magic link for ${email}:\n${magicLink}\n`);
      return;
    }

    const fromEmail = this.config.get<string>('EMAIL_FROM') || 'noreply@sutraid.com';
    console.log(`📤 Sending email via Resend from: ${fromEmail}`);

    try {
      const result = await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: '🔐 Sign in to SutraID',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🔐 Sign in to SutraID</h1>
                <p>Click the button below to securely sign in to your account:</p>
                <a href="${magicLink}" class="button">Sign In</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${magicLink}</p>
                <p><strong>This link expires in 15 minutes.</strong></p>
                <div class="footer">
                  <p>If you didn't request this email, you can safely ignore it.</p>
                  <p>SutraID - AI-Native Authentication</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      console.log(`✅ Email sent successfully via Resend!`);
      console.log(`📬 Email ID: ${result.data?.id || 'N/A'}\n`);
    } catch (error) {
      console.error('❌ Failed to send magic link email:', error);
      // Also log the magic link so user can still login
      console.log(`\n🔗 Fallback - Magic link for ${email}:\n${magicLink}\n`);
      throw new Error('Failed to send magic link email');
    }
  }

  /**
   * Get user from JWT token
   */
  async getUserFromToken(jti: string): Promise<any> {
    const session = await this.prisma.session.findUnique({
      where: { accessToken: jti },
      include: { user: true },
    });

    if (!session || session.revoked) {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    return session.user;
  }

  /**
   * Revoke a session (logout)
   */
  async revokeSession(jti: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { accessToken: jti },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: 'User logout',
      },
    });
  }

  /**
   * Verify access token and return payload
   */
  async verifyAccessToken(token: string): Promise<any> {
    try {
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(token, this.jwtSecret);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
