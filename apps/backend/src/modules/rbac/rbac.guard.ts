import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { OrgRole, MemberStatus } from '@prisma/client';
import { hasPermission } from './rbac.constants';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Decorator to specify required permissions on a route.
 * Usage: @RequirePermission('users:create', 'users:read')
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions specified, allow (auth-only route)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.orgId;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!orgId) {
      throw new ForbiddenException('Organization context required');
    }

    // Look up membership
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: user.id,
        },
      },
    });

    if (!membership || membership.status !== MemberStatus.ACTIVE) {
      throw new ForbiddenException('Not a member of this organization');
    }

    // SUPER_ADMIN bypasses all permission checks
    if (membership.role === OrgRole.SUPER_ADMIN) {
      request.orgRole = membership.role;
      request.orgId = orgId;
      return true;
    }

    // Check each required permission
    const hasAll = requiredPermissions.every((perm) =>
      hasPermission(membership.role, perm),
    );

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }

    request.orgRole = membership.role;
    request.orgId = orgId;
    return true;
  }
}
