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
      console.log('✅ Resend initialized with API key');
    } else {
      console.warn('⚠️  RESEND_API_KEY not set - magic links will only be logged to console');
    }

    // JWT secret
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    this.jwtSecret = new TextEncoder().encode(secret);

    // Frontend URL for magic link
    this.frontendUrl =
      this.config.get<string>('MAGIC_LINK_BASE_URL') ||
      this.config.get<string>('FRONTEND_URL') ||
      'http://localhost:3001';
    const fromEmail = this.config.get<string>('EMAIL_FROM') || 'SutraID <onboarding@resend.dev>';
    console.log(`📧 Email FROM: ${fromEmail}`);
    console.log(`🌐 Magic link base URL: ${this.frontendUrl}`);
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
      console.warn(`⚠️  Resend NOT configured - logging magic link to console`);
      console.log(`\n🔗 Magic link for ${email}:\n${magicLink}\n`);
      return;
    }

    // Default to Resend's test sender if no verified domain is configured
    // To use your own domain: set EMAIL_FROM="SutraID <noreply@yourdomain.com>"
    // and verify the domain in Resend dashboard first
    const fromEmail = this.config.get<string>('EMAIL_FROM') || 'SutraID <onboarding@resend.dev>';
    console.log(`📤 Sending email via Resend from: ${fromEmail} to: ${email}`);

    try {
      const result = await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Sign in to SutraID',
        html: `
          <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Sign in to SutraID</title>
              <style type="text/css">
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacOSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f9; color: #333333; line-height: 1.6; }
                .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
                .header { background: #ffffff; padding: 40px 40px 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
                .content { padding: 32px 40px; }
                h1 { 
                  font-size: 2.25rem; 
                  font-weight: 700; 
                  margin: 0 0 24px; 
                  letter-spacing: -0.5px; 
                  color: #111827; 
                  text-align: center;
                }
                .highlight { color: #4f46e5; }
                p { font-size: 16px; margin: 0 0 20px; }
                .button { display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; margin: 24px 0; }
                .button:hover { background-color: #333333; }
                .fallback { font-size: 14px; color: #555555; word-break: break-all; background: #f9fafb; padding: 12px 16px; border-radius: 6px; border: 1px solid #e5e7eb; }
                .expiry { font-size: 14px; color: #d32f2f; font-weight: 500; margin: 20px 0; }
                .footer { padding: 24px 40px; background: #f9fafb; text-align: center; font-size: 13px; color: #666666; border-top: 1px solid #e5e7eb; }
                .footer a { color: #0066ff; text-decoration: none; }
                @media only screen and (max-width: 600px) {
                  .content, .header, .footer { padding: 24px 20px; }
                  h1 { font-size: 2rem; }
                  .button { width: 100%; box-sizing: border-box; text-align: center; }
                }
              </style>
            </head>
            <body>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f9; padding: 20px 0;">
                <tr>
                  <td align="center">
                    <div class="container">
                      <div class="header">
                        <!-- Integrated logo into heading -->
                      </div>
                      <div class="content">
                        <h1>Sign in to <span class="highlight">S</span>utra<span class="highlight">ID</span></h1>
                        <p>Hello,</p>
                        <p>Click the button below to securely sign in to your SutraID account. No password required.</p>
                        
                        <a href="${magicLink}" class="button">Sign In Now</a>
                        
                        <p style="margin: 32px 0 16px;">Or copy and paste this link into your browser:</p>
                        <div class="fallback">${magicLink}</div>
                        
                        <p class="expiry"><strong>This link expires in 15 minutes for your security.</strong></p>
                        
                        <p>If you didn't request this sign-in link, please ignore this email — your account remains safe.</p>
                      </div>
                      <div class="footer">
                        <p>SutraID – AI-Native Authentication</p>
                        <p>© ${new Date().getFullYear()} SutraID. All rights reserved.</p>
                        <p><a href="https://sutraid.com/support">Need help?</a> | <a href="https://sutraid.com/privacy">Privacy Policy</a></p>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </body>
            </html>
        `,
      });

      if (result.error) {
        console.error('❌ Resend API returned error:', JSON.stringify(result.error));
        console.log(`🔗 Fallback - Magic link for ${email}:\n${magicLink}\n`);
        // Don't throw - the magic link was created in DB, user just won't get the email
        return;
      }

      console.log(`✅ Email sent successfully! Resend ID: ${result.data?.id}`);
    } catch (error: any) {
      console.error('❌ Failed to send magic link email:', error?.message || error);
      console.log(`🔗 Fallback - Magic link for ${email}:\n${magicLink}\n`);
      // Don't throw - the magic link was created in DB, log the link as fallback
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
