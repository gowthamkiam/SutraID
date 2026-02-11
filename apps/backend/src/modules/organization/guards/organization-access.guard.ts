import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationService } from '../organization.service';
import { OrgRole } from '@prisma/client';

// Decorator to specify required roles for a route
export const RequireOrgRoles = (...roles: OrgRole[]) =>
  SetMetadata('orgRoles', roles);

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private organizationService: OrganizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<OrgRole[]>(
      'orgRoles',
      context.getHandler(),
    );

    // If no roles specified, allow access (authorization handled by service)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.orgId;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!orgId) {
      throw new ForbiddenException('Organization ID required');
    }

    // Check user's role in organization
    const userRole = await this.organizationService.getUserRole(
      orgId,
      user.id,
    );

    if (!userRole) {
      throw new ForbiddenException('Access denied to this organization');
    }

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Add organization context to request
    request.orgId = orgId;
    request.orgRole = userRole;

    return true;
  }
}
