import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class OrgContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.organizationId) {
      throw new ForbiddenException('User is not bound to an organization');
    }

    if (!UUID_V4_REGEX.test(user.organizationId)) {
      throw new ForbiddenException('Invalid organization context');
    }

    const paramOrgId = request.params?.orgId as string | undefined;
    if (paramOrgId) {
      if (!UUID_V4_REGEX.test(paramOrgId)) {
        throw new ForbiddenException('Invalid organization id');
      }
      if (paramOrgId !== user.organizationId) {
        throw new ForbiddenException('Cross-organization access denied');
      }
    }

    request.orgId = user.organizationId;
    request.orgRole = user.role;

    return true;
  }
}
