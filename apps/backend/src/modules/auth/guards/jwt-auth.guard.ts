import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwtSecret: Uint8Array;

  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    this.jwtSecret = new TextEncoder().encode(secret);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      // Verify JWT
      const { payload } = await jwtVerify(token, this.jwtSecret);

      // Get user from database via session and enforce strict tenant scoping
      const user = await this.authService.getUserFromToken(payload.jti as string, payload.org_id as string);

      // We don't throw if user.organizationId is missing here because
      // users need to be able to create their first organization.
      // Individual routes that require an org will check it themselves or via another guard.

      // Attach user and JWT ID to request
      request.user = {
        ...user,
        jti: payload.jti,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
