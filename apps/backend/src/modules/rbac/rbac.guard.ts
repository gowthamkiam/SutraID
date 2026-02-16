import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgRole } from '@prisma/client';
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
  constructor(private reflector: Reflector) {}

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
    const orgIdFromParam = request.params.orgId as string | undefined;
    const userOrgId = user.organizationId as string | undefined;
    const userRole = user.role as OrgRole | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!userOrgId || !userRole) {
      throw new ForbiddenException('Organization context required');
    }

    if (orgIdFromParam && orgIdFromParam !== userOrgId) {
      throw new ForbiddenException('Cross-organization access denied');
    }

    // SUPER_ADMIN bypasses all permission checks
    if (userRole === OrgRole.SUPER_ADMIN) {
      request.orgRole = userRole;
      request.orgId = userOrgId;
      return true;
    }

    // Check each required permission
    const hasAll = requiredPermissions.every((perm) =>
      hasPermission(userRole, perm),
    );

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }

    request.orgRole = userRole;
    request.orgId = userOrgId;
    return true;
  }
}
