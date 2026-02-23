import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class OrgGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const orgIdFromParam = request.params.orgId;

        if (!user) {
            return false;
        }

        // Check if user has an org_id claim and it matches the route parameter
        if (!orgIdFromParam) {
            return true; // If no orgId in param, let it pass (or handle differently)
        }

        if (user.org_id && user.org_id !== orgIdFromParam) {
            throw new ForbiddenException(`Organization mismatch. Token belongs to ${user.org_id}, but route requested ${orgIdFromParam}`);
        }

        return true;
    }
}
