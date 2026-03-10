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
import * as bcrypt from 'bcrypt';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AuthResponseDto } from '../dto';
import { AuditService } from '../../audit/audit.service';
import { MfaService } from './mfa.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class AuthService {
  private resend: Resend;
  private jwtSecret: Uint8Array;
  private frontendUrl: string;
  private readonly execFileAsync = promisify(execFile);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private auditService: AuditService,
    @Inject(forwardRef(() => MfaService))
    private mfaService: MfaService,
  ) {
    const resendApiKey = this.config.get<string>('RESEND_API_KEY');
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
      console.log('Resend initialized with API key');
    } else {
      console.warn('RESEND_API_KEY not set - magic links will only be logged to console');
    }

    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    this.jwtSecret = new TextEncoder().encode(secret);

    this.frontendUrl =
      this.config.get<string>('MAGIC_LINK_BASE_URL') ||
      this.config.get<string>('FRONTEND_URL') ||
      'http://localhost:3001';
    const fromEmail = this.config.get<string>('EMAIL_FROM') || 'SutraID <onboarding@resend.dev>';
    console.log(`Email FROM: ${fromEmail}`);
    console.log(`Magic link base URL: ${this.frontendUrl}`);
  }

  async requestMagicLink(email: string): Promise<{ message: string }> {
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found. Please contact your administrator.');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Account is not active. Please contact support.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.authChallenge.create({
      data: {
        userId: user.id,
        type: 'MAGIC_LINK',
        token: tokenHash,
        identifier: email,
        expiresAt,
      },
    });

    const magicLink = `${this.frontendUrl}/auth/verify?token=${token}`;
    await this.sendMagicLinkEmail(email, magicLink);

    return { message: 'Magic link sent! Check your email to continue.' };
  }

  async verifyMagicLink(token: string): Promise<AuthResponseDto> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const challenge = await this.prisma.authChallenge.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!challenge) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }

    if (challenge.expiresAt < new Date()) {
      throw new UnauthorizedException('Magic link has expired');
    }

    if (challenge.verified) {
      throw new BadRequestException('Magic link has already been used');
    }

    await this.prisma.authChallenge.update({
      where: { id: challenge.id },
      data: { verified: true, verifiedAt: new Date() },
    });

    if (!challenge.user.emailVerified) {
      await this.prisma.user.update({
        where: { id: challenge.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      });
    }

    await this.prisma.user.update({
      where: { id: challenge.userId },
      data: { lastLoginAt: new Date() },
    });

    const mfaRequiredByPolicy = await this.isMfaRequiredByPolicy();

    if (challenge.user.mfaEnabled) {
      const mfaToken = await this.mfaService.createMfaToken(challenge.userId);
      await this.auditService.log({
        userId: challenge.userId,
        action: 'user.login',
        resource: 'auth:magic-link',
        result: 'SUCCESS',
        metadata: { method: 'magic_link', email: challenge.identifier, mfa_required: true },
      });
      return {
        tokenType: 'Bearer',
        user: {
          id: challenge.user.id,
          email: challenge.user.email,
          firstName: challenge.user.firstName,
          lastName: challenge.user.lastName,
        },
        mfaRequired: true,
        mfaToken,
      } as AuthResponseDto;
    }

    if (mfaRequiredByPolicy) {
      const session = await this.createSession(challenge.user);
      await this.auditService.log({
        userId: challenge.userId,
        action: 'user.login',
        resource: 'auth:magic-link',
        result: 'SUCCESS',
        metadata: { method: 'magic_link', email: challenge.identifier, mfa_enrollment_required: true },
      });
      return {
        ...session,
        mfaRequired: true,
        mfaEnrollmentRequired: true,
      };
    }

    const session = await this.createSession(challenge.user);

    await this.auditService.log({
      userId: challenge.userId,
      action: 'user.login',
      resource: 'auth:magic-link',
      result: 'SUCCESS',
      metadata: { method: 'magic_link', email: challenge.identifier },
    });

    return session;
  }

  private async createSession(user: any): Promise<AuthResponseDto> {
    const userMustChangePassword = !!(user as any).mustChangePassword;
    const jti = crypto.randomUUID();
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const expiresIn = 15 * 60;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const accessToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      type: 'access',
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .setJti(jti)
      .sign(this.jwtSecret);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        accessToken: jti,
        refreshToken: refreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
        role: user.role,
        mustChangePassword: userMustChangePassword,
      },
      mustChangePassword: userMustChangePassword,
    };
  }

  private async isMfaRequiredByPolicy(): Promise<boolean> {
    const appConfig = await this.prisma.appConfig.findUnique({
      where: { id: 'singleton' },
    });
    if (appConfig?.mfaRequired) return true;

    const signOnPolicies = await this.prisma.policy.findMany({
      where: { type: 'SIGN_ON', enabled: true },
      orderBy: { priority: 'desc' },
    });

    for (const policy of signOnPolicies) {
      const rules = policy.rules as any[];
      if (!Array.isArray(rules)) continue;
      for (const rule of rules) {
        if (rule.requirement === 'MFA_REQUIRED') return true;
      }
    }

    return false;
  }

  async registerWithPassword(email: string, password: string): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser?.passwordHash) {
      throw new BadRequestException('An account with this email already exists. Please sign in.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    if (existingUser) {
      user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
          emailVerified: true,
          emailVerifiedAt: existingUser.emailVerifiedAt || new Date(),
          mustChangePassword: false,
        } as any,
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          passwordChangedAt: new Date(),
          emailVerified: false,
          status: 'ACTIVE',
          mustChangePassword: false,
        } as any,
      });
    }

    const session = await this.createSession(user);

    await this.auditService.log({
      userId: user.id,
      action: 'user.register',
      resource: 'auth:password',
      result: 'SUCCESS',
      metadata: { method: 'password', email },
    });

    return session;
  }

  private buildLdapUserFilter(baseFilter: string | null, email: string) {
    const localPart = email.split('@')[0] || email;
    const escaped = email.replace(/\\/g, '\\5c').replace(/\*/g, '\\2a').replace(/\(/g, '\\28').replace(/\)/g, '\\29');
    const escapedLocal = localPart.replace(/\\/g, '\\5c').replace(/\*/g, '\\2a').replace(/\(/g, '\\28').replace(/\)/g, '\\29');
    const defaultFilter = `(|(mail=${escaped})(userPrincipalName=${escaped})(uid=${escaped})(uid=${escapedLocal})(sAMAccountName=${escapedLocal})(cn=${escapedLocal}))`;
    if (!baseFilter) return defaultFilter;
    return `(&${baseFilter}${defaultFilter})`;
  }

  private async tryDirectBindCandidates(
    ldapUrl: string,
    baseDn: string,
    email: string,
    password: string,
  ): Promise<boolean> {
    const localPart = email.split('@')[0] || email;
    const candidates = [
      `uid=${localPart},${baseDn}`,
      `cn=${localPart},${baseDn}`,
      `mail=${email},${baseDn}`,
    ];

    for (const dn of candidates) {
      try {
        await this.execFileAsync('ldapwhoami', ['-x', '-H', ldapUrl, '-D', dn, '-w', password], { timeout: 12000 });
        return true;
      } catch {
        // Try next candidate
      }
    }

    return false;
  }

  private async tryLdapAuth(
    email: string,
    password: string,
  ): Promise<{ ldapEnabled: boolean; foundInLdap: boolean; authenticated: boolean }> {
    const config = await this.prisma.directoryConfig.findFirst({
      where: { type: 'LDAP', enabled: true },
      select: {
        type: true,
        enabled: true,
        ldapUrl: true,
        ldapBaseDn: true,
        ldapBindDn: true,
        ldapBindPassword: true,
        ldapUserFilter: true,
      },
    });

    if (!config || !config.ldapUrl || !config.ldapBaseDn) {
      return { ldapEnabled: false, foundInLdap: false, authenticated: false };
    }

    try {
      const filter = this.buildLdapUserFilter(config.ldapUserFilter, email);
      const args: string[] = ['-LLL', '-x', '-H', config.ldapUrl, '-b', config.ldapBaseDn, filter, 'dn', 'mail', 'userPrincipalName'];

      if (config.ldapBindDn && config.ldapBindPassword) {
        args.splice(6, 0, '-D', config.ldapBindDn, '-w', config.ldapBindPassword);
      }

      const { stdout } = await this.execFileAsync('ldapsearch', args, { timeout: 12000 });
      const dnMatch = stdout.match(/^dn:\s*(.+)$/mi);
      if (!dnMatch?.[1]) {
        const directBindOk = await this.tryDirectBindCandidates(config.ldapUrl, config.ldapBaseDn, email, password);
        if (directBindOk) {
          return { ldapEnabled: true, foundInLdap: true, authenticated: true };
        }
        return { ldapEnabled: true, foundInLdap: false, authenticated: false };
      }

      const userDn = dnMatch[1].trim();
      await this.execFileAsync('ldapwhoami', ['-x', '-H', config.ldapUrl, '-D', userDn, '-w', password], { timeout: 12000 });
      return { ldapEnabled: true, foundInLdap: true, authenticated: true };
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        return { ldapEnabled: true, foundInLdap: false, authenticated: false };
      }
      if (typeof error?.cmd === 'string' && error.cmd.includes('ldapsearch')) {
        const directBindOk = await this.tryDirectBindCandidates(config.ldapUrl, config.ldapBaseDn, email, password);
        if (directBindOk) {
          return { ldapEnabled: true, foundInLdap: true, authenticated: true };
        }
        return { ldapEnabled: true, foundInLdap: false, authenticated: false };
      }
      return { ldapEnabled: true, foundInLdap: true, authenticated: false };
    }
  }

  private async ensureUserForEmail(email: string) {
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          status: 'ACTIVE',
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });
    }
    return user;
  }

  async loginWithPassword(email: string, password: string): Promise<AuthResponseDto> {
    const ldapResult = await this.tryLdapAuth(email, password);
    if (ldapResult.foundInLdap && !ldapResult.authenticated) {
      await this.auditService.log({
        action: 'user.login',
        resource: 'auth:password',
        result: 'FAILURE',
        metadata: { method: 'ldap_password', email, reason: 'wrong_password' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (ldapResult.authenticated) {
      const ldapUser = await this.ensureUserForEmail(email);

      await this.prisma.user.update({
        where: { id: ldapUser.id },
        data: { lastLoginAt: new Date(), status: 'ACTIVE' },
      });

      const mfaRequiredByPolicy = await this.isMfaRequiredByPolicy();

      if (ldapUser.mfaEnabled) {
        const mfaToken = await this.mfaService.createMfaToken(ldapUser.id);
        await this.auditService.log({
          userId: ldapUser.id,
          action: 'user.login',
          resource: 'auth:password',
          result: 'SUCCESS',
          metadata: { method: 'ldap_password', email, mfa_required: true },
        });
        return {
          tokenType: 'Bearer',
          user: {
            id: ldapUser.id,
            email: ldapUser.email,
            firstName: ldapUser.firstName,
            lastName: ldapUser.lastName,
          },
          mfaRequired: true,
          mfaToken,
        } as AuthResponseDto;
      }

      if (mfaRequiredByPolicy) {
        const session = await this.createSession(ldapUser);
        await this.auditService.log({
          userId: ldapUser.id,
          action: 'user.login',
          resource: 'auth:password',
          result: 'SUCCESS',
          metadata: { method: 'ldap_password', email, mfa_enrollment_required: true },
        });
        return {
          ...session,
          mfaRequired: true,
          mfaEnrollmentRequired: true,
        };
      }

      const session = await this.createSession(ldapUser);
      await this.auditService.log({
        userId: ldapUser.id,
        action: 'user.login',
        resource: 'auth:password',
        result: 'SUCCESS',
        metadata: { method: 'ldap_password', email },
      });
      return session;
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      await this.auditService.log({
        action: 'user.login',
        resource: 'auth:password',
        result: 'FAILURE',
        metadata: { method: 'password', email, reason: 'invalid_credentials' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      await this.auditService.log({
        userId: user.id,
        action: 'user.login',
        resource: 'auth:password',
        result: 'FAILURE',
        metadata: { method: 'password', email, reason: 'account_inactive' },
      });
      throw new BadRequestException('Account is not active. Please contact support.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await this.auditService.log({
        userId: user.id,
        action: 'user.login',
        resource: 'auth:password',
        result: 'FAILURE',
        metadata: { method: 'password', email, reason: 'wrong_password' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const mfaRequiredByPolicy = await this.isMfaRequiredByPolicy();
    const userMustChangePassword = !!(user as any).mustChangePassword;

    if (user.mfaEnabled) {
      const mfaToken = await this.mfaService.createMfaToken(user.id);

      await this.auditService.log({
        userId: user.id,
        action: 'user.login',
        resource: 'auth:password',
        result: 'SUCCESS',
        metadata: { method: 'password', email, mfa_required: true },
      });

      return {
        tokenType: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          mustChangePassword: userMustChangePassword,
        },
        mfaRequired: true,
        mfaToken,
        mustChangePassword: userMustChangePassword,
      } as AuthResponseDto;
    }

    if (mfaRequiredByPolicy) {
      await this.auditService.log({
        userId: user.id,
        action: 'user.login',
        resource: 'auth:password',
        result: 'SUCCESS',
        metadata: { method: 'password', email, mfa_enrollment_required: true },
      });

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const session = await this.createSession(user);
      return {
        ...session,
        mfaRequired: true,
        mfaEnrollmentRequired: true,
      };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const session = await this.createSession(user);

    await this.auditService.log({
      userId: user.id,
      action: 'user.login',
      resource: 'auth:password',
      result: 'SUCCESS',
      metadata: { method: 'password', email },
    });

    return session;
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.status !== 'ACTIVE') {
      return { message: 'If an account exists with that email, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.authChallenge.create({
      data: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        token: tokenHash,
        identifier: email,
        expiresAt,
      },
    });

    const resetLink = `${this.frontendUrl}/auth/reset-password?token=${token}`;
    await this.sendPasswordResetEmail(email, resetLink);

    await this.auditService.log({
      userId: user.id,
      action: 'user.password_reset_requested',
      resource: 'auth:password-reset',
      result: 'SUCCESS',
      metadata: { email },
    });

    return { message: 'If an account exists with that email, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const challenge = await this.prisma.authChallenge.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!challenge || challenge.type !== 'PASSWORD_RESET') {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    if (challenge.expiresAt < new Date()) {
      throw new UnauthorizedException('Reset link has expired');
    }

    if (challenge.verified) {
      throw new BadRequestException('Reset link has already been used');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.authChallenge.update({
      where: { id: challenge.id },
      data: { verified: true, verifiedAt: new Date() },
    });

    await this.prisma.user.update({
      where: { id: challenge.userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
      } as any,
    });

    await this.auditService.log({
      userId: challenge.userId,
      action: 'user.password_reset',
      resource: 'auth:password-reset',
      result: 'SUCCESS',
      metadata: { email: challenge.identifier },
    });

    return { message: 'Password has been reset successfully. You can now sign in.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('No password set. Use forgot password to set one.');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
      } as any,
    });

    await this.auditService.log({
      userId,
      action: 'user.password_changed',
      resource: 'auth:password',
      result: 'SUCCESS',
    });

    return { message: 'Password changed successfully.' };
  }

  private async sendMagicLinkEmail(email: string, magicLink: string): Promise<void> {
    console.log(`\nAttempting to send magic link to: ${email}`);
    console.log(`Magic link URL: ${magicLink}`);

    if (!this.resend) {
      console.warn(`Resend NOT configured - logging magic link to console`);
      console.log(`\nMagic link for ${email}:\n${magicLink}\n`);
      return;
    }

    const fromEmail = this.config.get<string>('EMAIL_FROM') || 'SutraID <onboarding@resend.dev>';

    try {
      const result = await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Sign in to SutraID',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Sign in to SutraID</title>
          <style type="text/css">body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f4f4f9;color:#333;line-height:1.6}.container{max-width:580px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}.header{background:#fff;padding:40px 40px 24px;text-align:center;border-bottom:1px solid #e5e7eb}.content{padding:32px 40px}h1{font-size:2.25rem;font-weight:700;margin:0 0 24px;letter-spacing:-.5px;color:#111827;text-align:center}.highlight{color:#4f46e5}p{font-size:16px;margin:0 0 20px}.button{display:inline-block;padding:14px 32px;background-color:#000;color:#fff!important;text-decoration:none;font-size:16px;font-weight:600;border-radius:6px;margin:24px 0}.fallback{font-size:14px;color:#555;word-break:break-all;background:#f9fafb;padding:12px 16px;border-radius:6px;border:1px solid #e5e7eb}.expiry{font-size:14px;color:#d32f2f;font-weight:500;margin:20px 0}.footer{padding:24px 40px;background:#f9fafb;text-align:center;font-size:13px;color:#666;border-top:1px solid #e5e7eb}.footer a{color:#06f;text-decoration:none}</style>
          </head>
          <body><table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f4f9;padding:20px 0"><tr><td align="center"><div class="container"><div class="header"></div><div class="content"><h1>Sign in to <span class="highlight">S</span>utra<span class="highlight">ID</span></h1><p>Hello,</p><p>Click the button below to securely sign in to your SutraID account.</p><a href="${magicLink}" class="button">Sign In Now</a><p style="margin:32px 0 16px">Or copy and paste this link:</p><div class="fallback">${magicLink}</div><p class="expiry"><strong>This link expires in 15 minutes.</strong></p><p>If you didn't request this, please ignore this email.</p></div><div class="footer"><p>SutraID</p><p>&copy; ${new Date().getFullYear()} SutraID</p></div></div></td></tr></table></body></html>
        `,
      });

      if (result.error) {
        console.error('Resend API error:', JSON.stringify(result.error));
        console.log(`Fallback - Magic link for ${email}:\n${magicLink}\n`);
        return;
      }
      console.log(`Email sent! Resend ID: ${result.data?.id}`);
    } catch (error: any) {
      console.error('Failed to send magic link email:', error?.message || error);
      console.log(`Fallback - Magic link for ${email}:\n${magicLink}\n`);
    }
  }

  private async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    console.log(`\nAttempting to send password reset to: ${email}`);

    if (!this.resend) {
      console.warn(`Resend NOT configured - logging reset link to console`);
      console.log(`\nReset link for ${email}:\n${resetLink}\n`);
      return;
    }

    const fromEmail = this.config.get<string>('EMAIL_FROM') || 'SutraID <onboarding@resend.dev>';

    try {
      const result = await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Reset your SutraID password',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reset your SutraID password</title>
          <style type="text/css">body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f4f4f9;color:#333;line-height:1.6}.container{max-width:580px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}.header{background:#fff;padding:40px 40px 24px;text-align:center;border-bottom:1px solid #e5e7eb}.content{padding:32px 40px}h1{font-size:2.25rem;font-weight:700;margin:0 0 24px;letter-spacing:-.5px;color:#111827;text-align:center}.highlight{color:#4f46e5}p{font-size:16px;margin:0 0 20px}.button{display:inline-block;padding:14px 32px;background-color:#4f46e5;color:#fff!important;text-decoration:none;font-size:16px;font-weight:600;border-radius:50px;margin:24px 0}.fallback{font-size:14px;color:#555;word-break:break-all;background:#f9fafb;padding:12px 16px;border-radius:6px;border:1px solid #e5e7eb}.expiry{font-size:14px;color:#d32f2f;font-weight:500;margin:20px 0}.footer{padding:24px 40px;background:#f9fafb;text-align:center;font-size:13px;color:#666;border-top:1px solid #e5e7eb}.footer a{color:#4f46e5;text-decoration:none}</style>
          </head>
          <body><table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f4f9;padding:20px 0"><tr><td align="center"><div class="container"><div class="header"></div><div class="content"><h1>Reset your <span class="highlight">S</span>utra<span class="highlight">ID</span> password</h1><p>Hello,</p><p>Click the button below to choose a new password.</p><a href="${resetLink}" class="button">Reset Password</a><p style="margin:32px 0 16px">Or copy and paste this link:</p><div class="fallback">${resetLink}</div><p class="expiry"><strong>This link expires in 15 minutes.</strong></p><p>If you didn't request a password reset, please ignore this email.</p></div><div class="footer"><p>SutraID</p><p>&copy; ${new Date().getFullYear()} SutraID</p></div></div></td></tr></table></body></html>
        `,
      });

      if (result.error) {
        console.error('Resend API error:', JSON.stringify(result.error));
        console.log(`Fallback - Reset link for ${email}:\n${resetLink}\n`);
        return;
      }
      console.log(`Password reset email sent! Resend ID: ${result.data?.id}`);
    } catch (error: any) {
      console.error('Failed to send password reset email:', error?.message || error);
      console.log(`Fallback - Reset link for ${email}:\n${resetLink}\n`);
    }
  }

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

    return {
      ...session.user,
      role: session.user.role,
    };
  }

  async revokeSession(jti: string): Promise<void> {
    const session = await this.prisma.session.findUnique({
      where: { accessToken: jti },
    });

    await this.prisma.session.updateMany({
      where: { accessToken: jti },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: 'User logout',
      },
    });

    if (session) {
      await this.auditService.log({
        userId: session.userId,
        action: 'user.logout',
        resource: 'auth:session',
        result: 'SUCCESS',
      });
    }
  }

  async verifyAccessToken(token: string): Promise<any> {
    try {
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(token, this.jwtSecret);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async createSessionForUser(user: any): Promise<AuthResponseDto> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const session = await this.createSession(user);

    await this.auditService.log({
      userId: user.id,
      action: 'user.login',
      resource: 'auth:mfa',
      result: 'SUCCESS',
      metadata: { method: 'password+mfa', email: user.email },
    });

    return session;
  }

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
