import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MfaEnforcementGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true;
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userRecord || userRecord.mfaEnabled) {
      return true;
    }

    const mfaRequired = await this.isMfaRequired();
    if (!mfaRequired) {
      return true;
    }

    const appConfig = await this.prisma.appConfig.findUnique({
      where: { id: 'singleton' },
    });

    const gracePeriodDays = appConfig?.mfaGracePeriodDays ?? 0;
    const accountAge = Date.now() - userRecord.createdAt.getTime();
    const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;

    if (accountAge > gracePeriodMs) {
      throw new ForbiddenException(
        'MFA is required. Please enable MFA to continue.'
      );
    }

    return true;
  }

  private async isMfaRequired(): Promise<boolean> {
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
}
