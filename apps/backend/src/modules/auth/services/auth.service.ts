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
import { OrgRole } from '@prisma/client';
import { generateRandomKebabOrgName } from '../../organization/utils/org-name-generator';

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

  /**
   * Create a new session with access and refresh tokens
   */
  private async createSession(user: any, preferredOrgId?: string): Promise<AuthResponseDto> {
    const userMustChangePassword = !!(user as any).mustChangePassword;
    const jti = crypto.randomUUID();
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // JWT expiration (15 minutes)
    const expiresIn = 15 * 60; // seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Ensure user belongs to an organization (auto-create if needed)
    const orgInfo = await this.ensureOrganization(user.id, preferredOrgId);

    // Create access token (JWT)
    const accessToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      type: 'access',
      org_id: orgInfo.id,
      org_name: orgInfo.name,
      org_role: orgInfo.role,
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
        organizationId: orgInfo.id,
        role: orgInfo.role,
        mustChangePassword: userMustChangePassword,
      },
      organization: orgInfo,
      mustChangePassword: userMustChangePassword,
    };
  }

  /**
   * Ensure user has an organization. Auto-create one if they don't.
   * First user of an auto-created org becomes SUPER_ADMIN.
   */
  private async ensureOrganization(userId: string, preferredOrgId?: string): Promise<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }> {
    const existing = preferredOrgId
      ? await this.prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: preferredOrgId, userId } },
        include: { organization: true },
      })
      : await this.prisma.organizationMember.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { organization: true },
      });

    if (existing && existing.status === 'ACTIVE') {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          organizationId: existing.organization.id,
          role: existing.role as any,
        } as any,
      });
      return {
        id: existing.organization.id,
        name: existing.organization.name,
        slug: existing.organization.slug,
        role: existing.role,
      };
    }

    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = generateRandomKebabOrgName();
      const slug = `${candidate}-${crypto.randomUUID().slice(0, 8)}`;

      const existingName = await this.prisma.organization.findFirst({
        where: { name: candidate },
        select: { id: true },
      });
      if (existingName) {
        continue;
      }

      try {
        const org = await this.prisma.$transaction(async (tx) => {
          const createdOrg = await tx.organization.create({
            data: {
              id: crypto.randomUUID(),
              name: candidate,
              slug,
              plan: 'FREE',
              status: 'ACTIVE',
              members: {
                create: {
                  userId,
                  role: OrgRole.SUPER_ADMIN,
                  status: 'ACTIVE',
                  joinedAt: new Date(),
                },
              },
            },
          });

          return createdOrg;
        });

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            organizationId: org.id,
            role: OrgRole.SUPER_ADMIN,
          } as any,
        });

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: OrgRole.SUPER_ADMIN,
        };
      } catch (error: any) {
        if (attempt === 19) {
          throw error;
        }
      }
    }

    throw new BadRequestException('Failed to create unique organization');
  }

  /**
   * Register a new user with email and password
   */
  async registerWithPassword(email: string, password: string): Promise<AuthResponseDto> {
    // Check if user already exists with a password
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser?.passwordHash) {
      throw new BadRequestException('An account with this email already exists. Please sign in.');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    if (existingUser) {
      // User exists from magic link — set their password
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

  /**
   * Login with email and password
   */
  private async resolveOrganizationId(orgRef: string): Promise<string> {
    const trimmed = (orgRef || '').trim();
    if (!trimmed) {
      throw new BadRequestException('organizationId is required');
    }
    const byId = await this.prisma.organization.findUnique({ where: { id: trimmed }, select: { id: true } });
    if (byId) return byId.id;
    const bySlug = await this.prisma.organization.findUnique({ where: { slug: trimmed }, select: { id: true } });
    if (bySlug) return bySlug.id;
    const byName = await this.prisma.organization.findFirst({ where: { name: trimmed }, select: { id: true } });
    if (byName) return byName.id;
    throw new NotFoundException('Organization not found');
  }

  private buildOrgUserFilter(baseFilter: string | null, email: string) {
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

  private async tryLdapAuthForOrganization(
    organizationId: string,
    email: string,
    password: string,
  ): Promise<{ ldapEnabled: boolean; foundInLdap: boolean; authenticated: boolean }> {
    const config = await this.prisma.directoryConfig.findUnique({
      where: { organizationId },
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

    if (!config || config.type !== 'LDAP' || !config.enabled || !config.ldapUrl || !config.ldapBaseDn) {
      return { ldapEnabled: false, foundInLdap: false, authenticated: false };
    }

    try {
      const filter = this.buildOrgUserFilter(config.ldapUserFilter, email);
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

  private async ensureOrgMembershipForEmail(organizationId: string, email: string) {
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          status: 'ACTIVE',
          emailVerified: true,
          emailVerifiedAt: new Date(),
          organizationId,
          role: OrgRole.READ_ONLY_ADMIN,
        } as any,
      });
    }

    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: user.id } },
      select: { id: true },
    });

    if (!member) {
      await this.prisma.organizationMember.create({
        data: {
          organizationId,
          userId: user.id,
          role: OrgRole.READ_ONLY_ADMIN,
          status: 'ACTIVE',
        },
      });
    } else {
      await this.prisma.organizationMember.update({
        where: { organizationId_userId: { organizationId, userId: user.id } },
        data: { status: 'ACTIVE' },
      });
    }

    if (user.organizationId !== organizationId) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { organizationId, role: OrgRole.READ_ONLY_ADMIN } as any,
      });
    }

    return user;
  }

  async loginWithPassword(email: string, password: string, orgRef: string): Promise<AuthResponseDto> {
    const organizationId = await this.resolveOrganizationId(orgRef);

    const ldapResult = await this.tryLdapAuthForOrganization(organizationId, email, password);
    if (ldapResult.foundInLdap && !ldapResult.authenticated) {
      await this.auditService.log({
        action: 'user.login',
        resource: 'auth:password',
        result: 'FAILURE',
        metadata: { method: 'ldap_password', email, reason: 'wrong_password', organizationId },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (ldapResult.authenticated) {
      const ldapUser = await this.ensureOrgMembershipForEmail(organizationId, email);

      await this.prisma.user.update({
        where: { id: ldapUser.id },
        data: { lastLoginAt: new Date(), status: 'ACTIVE' },
      });

      const session = await this.createSession(ldapUser, organizationId);
      await this.auditService.log({
        userId: ldapUser.id,
        action: 'user.login',
        resource: 'auth:password',
        result: 'SUCCESS',
        metadata: { method: 'ldap_password', email, organizationId },
      });
      return session;
    }

    const user = await this.prisma.user.findUnique({ where: { email } });

    const membership = user
      ? await this.prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId, userId: user.id } },
        select: { status: true },
      })
      : null;

    if (!user || !user.passwordHash || !membership || membership.status !== 'ACTIVE') {
      await this.auditService.log({
        action: 'user.login',
        resource: 'auth:password',
        result: 'FAILURE',
        metadata: { method: 'password', email, reason: 'invalid_credentials', organizationId },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      await this.auditService.log({
        userId: user.id,
        action: 'user.login',
        resource: 'auth:password',
        result: 'FAILURE',
        metadata: { method: 'password', email, reason: 'account_inactive', organizationId },
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
        metadata: { method: 'password', email, reason: 'wrong_password', organizationId },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if MFA is enabled
    if (user.mfaEnabled) {
      const mfaToken = await this.mfaService.createMfaToken(user.id);

      await this.auditService.log({
        userId: user.id,
        action: 'user.login',
        resource: 'auth:password',
        result: 'SUCCESS',
        metadata: { method: 'password', email, mfa_required: true, organizationId },
      });

      const userMustChangePassword = !!(user as any).mustChangePassword;
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const session = await this.createSession(user, organizationId);

    await this.auditService.log({
      userId: user.id,
      action: 'user.login',
      resource: 'auth:password',
      result: 'SUCCESS',
      metadata: { method: 'password', email, organizationId },
    });

    return session;
  }

  /**
   * Request a password reset email
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || user.status !== 'ACTIVE') {
      return { message: 'If an account exists with that email, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
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

  /**
   * Reset password using a valid token
   */
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

    // Mark challenge as used and update password
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

  /**
   * Change password for an authenticated user
   */
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
   * Send password reset email via Resend
   */
  private async sendPasswordResetEmail(
    email: string,
    resetLink: string,
  ): Promise<void> {
    console.log(`\n📧 Attempting to send password reset to: ${email}`);
    console.log(`🔗 Reset link URL: ${resetLink}`);

    if (!this.resend) {
      console.warn(`⚠️  Resend NOT configured - logging reset link to console`);
      console.log(`\n🔗 Reset link for ${email}:\n${resetLink}\n`);
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
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset your SutraID password</title>
            <style type="text/css">
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f9; color: #333333; line-height: 1.6; }
              .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
              .header { background: #ffffff; padding: 40px 40px 24px; text-align: center; border-bottom: 1px solid #e5e7eb; }
              .content { padding: 32px 40px; }
              h1 { font-size: 2.25rem; font-weight: 700; margin: 0 0 24px; letter-spacing: -0.5px; color: #111827; text-align: center; }
              .highlight { color: #4f46e5; }
              p { font-size: 16px; margin: 0 0 20px; }
              .button { display: inline-block; padding: 14px 32px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 50px; margin: 24px 0; }
              .fallback { font-size: 14px; color: #555555; word-break: break-all; background: #f9fafb; padding: 12px 16px; border-radius: 6px; border: 1px solid #e5e7eb; }
              .expiry { font-size: 14px; color: #d32f2f; font-weight: 500; margin: 20px 0; }
              .footer { padding: 24px 40px; background: #f9fafb; text-align: center; font-size: 13px; color: #666666; border-top: 1px solid #e5e7eb; }
              .footer a { color: #4f46e5; text-decoration: none; }
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
                    <div class="header"></div>
                    <div class="content">
                      <h1>Reset your <span class="highlight">S</span>utra<span class="highlight">ID</span> password</h1>
                      <p>Hello,</p>
                      <p>We received a request to reset your password. Click the button below to choose a new password.</p>
                      <a href="${resetLink}" class="button">Reset Password</a>
                      <p style="margin: 32px 0 16px;">Or copy and paste this link into your browser:</p>
                      <div class="fallback">${resetLink}</div>
                      <p class="expiry"><strong>This link expires in 15 minutes for your security.</strong></p>
                      <p>If you didn't request a password reset, please ignore this email — your password remains unchanged.</p>
                    </div>
                    <div class="footer">
                      <p>SutraID - AI-Native Authentication</p>
                      <p>&copy; ${new Date().getFullYear()} SutraID. All rights reserved.</p>
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
        console.log(`🔗 Fallback - Reset link for ${email}:\n${resetLink}\n`);
        return;
      }

      console.log(`✅ Password reset email sent! Resend ID: ${result.data?.id}`);
    } catch (error: any) {
      console.error('❌ Failed to send password reset email:', error?.message || error);
      console.log(`🔗 Fallback - Reset link for ${email}:\n${resetLink}\n`);
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

    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId: session.userId,
        status: 'ACTIVE',
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return {
      ...session.user,
      organizationId: membership?.organizationId || null,
      role: membership?.role || null,
      organization: membership?.organization || null,
      // Snake case versions to match JWT claims
      org_id: membership?.organizationId || null,
      org_name: membership?.organization?.name || null,
      org_role: membership?.role || null,
    };
  }

  /**
   * Revoke a session (logout)
   */
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
   * Public wrapper for createSession (used by MFA controller after verification)
   */
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
