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
      return true; // Let JwtAuthGuard handle authentication
    }

    // Get app-wide MFA settings
    const appConfig = await this.prisma.appConfig.findUnique({
      where: { id: 'singleton' },
    });

    if (!appConfig) {
      return true; // No config, no enforcement
    }

    // Check if MFA is required
    if (appConfig.mfaRequired) {
      const userRecord = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (userRecord && !userRecord.mfaEnabled) {
        // Check grace period
        const accountAge = Date.now() - userRecord.createdAt.getTime();
        const gracePeriodMs = appConfig.mfaGracePeriodDays * 24 * 60 * 60 * 1000;

        if (accountAge > gracePeriodMs) {
          throw new ForbiddenException(
            'MFA is required. Please enable MFA to continue.'
          );
        }
      }
    }

    return true;
  }
}
