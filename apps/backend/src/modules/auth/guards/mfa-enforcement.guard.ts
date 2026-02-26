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

    // Get user's organization
    const orgMember = await this.prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });

    if (!orgMember?.organization) {
      return true; // No organization, no enforcement
    }

    const org = orgMember.organization;

    // Check if MFA is required for this organization
    if (org.mfaRequired) {
      const userRecord = await this.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!userRecord?.mfaEnabled) {
        // Check grace period
        const accountAge = Date.now() - userRecord.createdAt.getTime();
        const gracePeriodMs = org.mfaGracePeriodDays * 24 * 60 * 60 * 1000;

        if (accountAge > gracePeriodMs) {
          throw new ForbiddenException(
            'MFA is required for your organization. Please enable MFA to continue.'
          );
        }
      }
    }

    return true;
  }
}
