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

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userRole = user?.role as OrgRole | undefined;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!userRole) {
      throw new ForbiddenException('User role required');
    }

    if (userRole === OrgRole.SUPER_ADMIN) {
      request.orgRole = userRole;
      return true;
    }

    const hasAll = requiredPermissions.every((perm) =>
      hasPermission(userRole, perm),
    );

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }

    request.orgRole = userRole;
    return true;
  }
}
