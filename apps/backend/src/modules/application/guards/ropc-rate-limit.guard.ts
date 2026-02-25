import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RopcRateLimitGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Only rate limit password grant requests
    if (request.body?.grant_type !== 'password') {
      return true;
    }
    return super.canActivate(context);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const clientId = req.body?.client_id || 'unknown';
    const username = req.body?.username || 'unknown';
    return `ropc:${ip}:${clientId}:${username}`;
  }
}
