import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { SignJWT } from 'jose';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server';

@Injectable()
export class MfaService {
  private jwtSecret: Uint8Array;
  private encryptionKey: Buffer;
  private challengeStore = new Map<string, { challenge: string; expires: number }>();

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private auditService: AuditService,
  ) {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    this.jwtSecret = new TextEncoder().encode(secret);

    const encKey = this.config.get<string>('MFA_ENCRYPTION_KEY');
    if (encKey) {
      this.encryptionKey = Buffer.from(encKey, 'hex');
    } else {
      // Generate a deterministic key from JWT_SECRET for development
      this.encryptionKey = crypto.createHash('sha256').update(secret).digest();
      console.warn('⚠️  MFA_ENCRYPTION_KEY not set — deriving from JWT_SECRET (set in production!)');
    }
  }

  /**
   * Enroll user in TOTP MFA
   */
  async enrollTotp(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if user already has an active TOTP method
    const existing = await this.prisma.mfaMethod.findFirst({
      where: { userId, type: 'TOTP', verified: true, enabled: true },
    });
    if (existing) {
      throw new BadRequestException('TOTP MFA is already enabled. Disable it first to re-enroll.');
    }

    // Delete any unverified enrollment attempts
    await this.prisma.mfaMethod.deleteMany({
      where: { userId, type: 'TOTP', verified: false },
    });

    // Generate TOTP secret
    const secret = new OTPAuth.Secret({ size: 20 });
    const totpSecret = secret.base32;

    // Encrypt the secret
    const { encrypted, iv, authTag } = this.encryptSecret(totpSecret);

    // Generate backup codes
    const plainBackupCodes = this.generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      plainBackupCodes.map((code) => bcrypt.hash(code, 10)),
    );

    // Create MFA method record
    const method = await this.prisma.mfaMethod.create({
      data: {
        userId,
        type: 'TOTP',
        name: 'Authenticator App',
        totpSecret: encrypted,
        totpEncryptionIv: iv,
        totpAuthTag: authTag,
        backupCodes: hashedBackupCodes,
        verified: false,
      },
    });

    // Generate QR code
    const totp = new OTPAuth.TOTP({
      issuer: 'SutraID',
      label: user.email,
      secret: OTPAuth.Secret.fromBase32(totpSecret),
      digits: 6,
      period: 30,
    });
    const otpauthUrl = totp.toString();
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      methodId: method.id,
      secret: totpSecret,
      qrCodeDataUrl,
      backupCodes: plainBackupCodes,
    };
  }

  /**
   * Verify TOTP enrollment with first code
   */
  async verifyTotpEnrollment(userId: string, methodId: string, code: string) {
    const method = await this.prisma.mfaMethod.findFirst({
      where: { id: methodId, userId, type: 'TOTP', verified: false },
    });

    if (!method) {
      throw new BadRequestException('No pending TOTP enrollment found');
    }

    // Decrypt and verify
    const secret = this.decryptSecret(
      method.totpSecret!,
      method.totpEncryptionIv!,
      method.totpAuthTag!,
    );

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) {
      throw new BadRequestException('Invalid verification code. Please try again.');
    }

    // Mark as verified and enable MFA on user
    await this.prisma.$transaction([
      this.prisma.mfaMethod.update({
        where: { id: methodId },
        data: { verified: true, lastUsedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      }),
    ]);

    try {
      await this.auditService.log({
        userId,
        action: 'user.mfa.enrolled',
        resource: 'auth:mfa',
        result: 'SUCCESS',
        metadata: { type: 'TOTP' },
      });
    } catch (e) {
      console.error('Audit log failed:', e);
    }

    return { success: true };
  }

  /**
   * Verify TOTP code (used during login challenge)
   */
  async verifyTotpCode(userId: string, code: string): Promise<boolean> {
    const method = await this.prisma.mfaMethod.findFirst({
      where: { userId, type: 'TOTP', verified: true, enabled: true },
    });

    if (!method) return false;

    const secret = this.decryptSecret(
      method.totpSecret!,
      method.totpEncryptionIv!,
      method.totpAuthTag!,
    );

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code, window: 1 });
    const isValid = delta !== null;

    if (isValid) {
      await this.prisma.mfaMethod.update({
        where: { id: method.id },
        data: { lastUsedAt: new Date() },
      });

      try {
        await this.auditService.log({
          userId,
          action: 'user.mfa.verified',
          resource: 'auth:mfa',
          result: 'SUCCESS',
          metadata: { type: 'TOTP' },
        });
      } catch (e) {
        console.error('Audit log failed:', e);
      }
    }

    return isValid;
  }

  /**
   * Verify backup code (one-time use)
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const method = await this.prisma.mfaMethod.findFirst({
      where: { userId, type: 'TOTP', verified: true, enabled: true },
    });

    if (!method || method.backupCodes.length === 0) return false;

    // Find matching backup code
    let matchIndex = -1;
    for (let i = 0; i < method.backupCodes.length; i++) {
      const matches = await bcrypt.compare(code, method.backupCodes[i]);
      if (matches) {
        matchIndex = i;
        break;
      }
    }

    if (matchIndex === -1) return false;

    // Remove used backup code
    const updatedCodes = [...method.backupCodes];
    updatedCodes.splice(matchIndex, 1);

    await this.prisma.mfaMethod.update({
      where: { id: method.id },
      data: {
        backupCodes: updatedCodes,
        lastUsedAt: new Date(),
      },
    });

    try {
      await this.auditService.log({
        userId,
        action: 'user.mfa.backup_code_used',
        resource: 'auth:mfa',
        result: 'SUCCESS',
        metadata: { remainingCodes: updatedCodes.length },
      });
    } catch (e) {
      console.error('Audit log failed:', e);
    }

    return true;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string) {
    const method = await this.prisma.mfaMethod.findFirst({
      where: { userId, type: 'TOTP', verified: true, enabled: true },
    });

    if (!method) {
      throw new BadRequestException('MFA is not enabled');
    }

    const plainBackupCodes = this.generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      plainBackupCodes.map((code) => bcrypt.hash(code, 10)),
    );

    await this.prisma.mfaMethod.update({
      where: { id: method.id },
      data: { backupCodes: hashedBackupCodes },
    });

    try {
      await this.auditService.log({
        userId,
        action: 'user.mfa.backup_codes_regenerated',
        resource: 'auth:mfa',
        result: 'SUCCESS',
      });
    } catch (e) {
      console.error('Audit log failed:', e);
    }

    return { backupCodes: plainBackupCodes };
  }

  /**
   * Disable TOTP MFA
   */
  async disableTotp(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Require password confirmation
    if (!user.passwordHash) {
      throw new BadRequestException('Cannot disable MFA without a password set');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.prisma.$transaction([
      this.prisma.mfaMethod.updateMany({
        where: { userId, type: 'TOTP' },
        data: { enabled: false },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: false },
      }),
    ]);

    try {
      await this.auditService.log({
        userId,
        action: 'user.mfa.disabled',
        resource: 'auth:mfa',
        result: 'SUCCESS',
      });
    } catch (e) {
      console.error('Audit log failed:', e);
    }

    return { success: true };
  }

  /**
   * Get MFA status for a user
   */
  async getMfaStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        mfaMethods: {
          where: { verified: true, enabled: true },
          select: {
            id: true,
            type: true,
            name: true,
            verified: true,
            lastUsedAt: true,
            backupCodes: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      enabled: user.mfaEnabled,
      methods: user.mfaMethods.map((m) => ({
        id: m.id,
        type: m.type,
        name: m.name,
        verified: m.verified,
        lastUsedAt: m.lastUsedAt,
        backupCodesRemaining: m.backupCodes.length,
      })),
    };
  }

  /**
   * Create a short-lived MFA challenge token (5 min)
   */
  async createMfaToken(userId: string): Promise<string> {
    const mfaJti = crypto.randomUUID();

    const token = await new SignJWT({
      sub: userId,
      type: 'mfa_challenge',
      mfaJti,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(this.jwtSecret);

    return token;
  }

  /**
   * Verify an MFA challenge token
   */
  async verifyMfaToken(token: string): Promise<{ userId: string }> {
    try {
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(token, this.jwtSecret);

      if (payload.type !== 'mfa_challenge') {
        throw new UnauthorizedException('Invalid MFA token');
      }

      return { userId: payload.sub as string };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired MFA token');
    }
  }

  private get rpID(): string {
    return this.config.get<string>('APP_DOMAIN') || 'localhost';
  }

  private get expectedOrigin(): string | string[] {
    const raw = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3001';
    const origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
    return origins.length === 1 ? origins[0] : origins;
  }

  async getPasskeyOptions(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existingDevices = await this.prisma.mfaMethod.findMany({
      where: { userId, type: 'FIDO2', enabled: true, verified: true },
    });

    const options = await generateRegistrationOptions({
      rpName: 'SutraID',
      rpID: this.rpID,
      userName: user.email,
      userDisplayName: user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
      excludeCredentials: existingDevices
        .filter((d) => d.webAuthnCredentialID)
        .map((d) => ({
          id: d.webAuthnCredentialID!,
          transports: d.webAuthnTransports as AuthenticatorTransportFuture[],
        })),
      supportedAlgorithmIDs: [-7, -257],
    });

    this.challengeStore.set(userId, {
      challenge: options.challenge,
      expires: Date.now() + 5 * 60 * 1000,
    });

    return options;
  }

  async enrollPasskey(userId: string, credential: RegistrationResponseJSON) {
    const stored = this.challengeStore.get(userId);
    if (!stored || Date.now() > stored.expires) {
      throw new BadRequestException('Challenge expired or not found. Please request new options.');
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: stored.challenge,
      expectedOrigin: this.expectedOrigin,
      expectedRPID: this.rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Passkey verification failed');
    }

    const { credential: cred, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;
    this.challengeStore.delete(userId);

    await this.prisma.mfaMethod.create({
      data: {
        userId,
        type: 'FIDO2',
        name: credentialBackedUp ? 'Synced Passkey' : 'Device-bound Passkey',
        webAuthnCredentialID: cred.id,
        webAuthnPublicKey: Buffer.from(cred.publicKey).toString('base64url'),
        webAuthnCounter: cred.counter,
        webAuthnTransports: (credential.response.transports as string[]) || [],
        verified: true,
        enabled: true,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    try {
      await this.auditService.log({
        userId,
        action: 'user.mfa.enrolled',
        resource: 'auth:mfa',
        result: 'SUCCESS',
        metadata: { type: 'FIDO2', deviceType: credentialDeviceType },
      });
    } catch (e) {
      console.error('Audit log failed:', e);
    }

    return { success: true };
  }

  async getPasskeyAuthOptions(userId: string) {
    const methods = await this.prisma.mfaMethod.findMany({
      where: { userId, type: 'FIDO2', enabled: true, verified: true },
    });

    if (methods.length === 0) {
      throw new BadRequestException('No passkeys enrolled');
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      userVerification: 'preferred',
      allowCredentials: methods
        .filter((m) => m.webAuthnCredentialID)
        .map((m) => ({
          id: m.webAuthnCredentialID!,
          transports: m.webAuthnTransports as AuthenticatorTransportFuture[],
        })),
    });

    this.challengeStore.set(`auth:${userId}`, {
      challenge: options.challenge,
      expires: Date.now() + 5 * 60 * 1000,
    });

    return options;
  }

  async verifyPasskeyAuth(
    userId: string,
    response: AuthenticationResponseJSON,
  ): Promise<boolean> {
    const stored = this.challengeStore.get(`auth:${userId}`);
    if (!stored || Date.now() > stored.expires) return false;

    const method = await this.prisma.mfaMethod.findFirst({
      where: {
        userId,
        type: 'FIDO2',
        webAuthnCredentialID: response.id,
        enabled: true,
        verified: true,
      },
    });
    if (!method || !method.webAuthnPublicKey) return false;

    try {
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: stored.challenge,
        expectedOrigin: this.expectedOrigin,
        expectedRPID: this.rpID,
        credential: {
          id: method.webAuthnCredentialID!,
          publicKey: Buffer.from(method.webAuthnPublicKey, 'base64url'),
          counter: method.webAuthnCounter || 0,
          transports: method.webAuthnTransports as AuthenticatorTransportFuture[],
        },
      });

      if (verification.verified) {
        this.challengeStore.delete(`auth:${userId}`);
        await this.prisma.mfaMethod.update({
          where: { id: method.id },
          data: {
            webAuthnCounter: verification.authenticationInfo.newCounter,
            lastUsedAt: new Date(),
          },
        });

        try {
          await this.auditService.log({
            userId,
            action: 'user.mfa.verified',
            resource: 'auth:mfa',
            result: 'SUCCESS',
            metadata: { type: 'FIDO2' },
          });
        } catch (e) {
          console.error('Audit log failed:', e);
        }
      }

      return verification.verified;
    } catch {
      return false;
    }
  }

  // ===== Private helpers =====

  private encryptSecret(secret: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  private decryptSecret(encrypted: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // 8-character alphanumeric codes
      codes.push(crypto.randomBytes(4).toString('hex'));
    }
    return codes;
  }
}
