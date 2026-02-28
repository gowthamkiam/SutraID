import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { jwtVerify, createRemoteJWKSet } from 'jose';

@Injectable()
export class AiAgentAuthGuard implements CanActivate {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const jwksUrl = await this.getJWKSUrl();
      const JWKS = createRemoteJWKSet(new URL(jwksUrl));
      const { payload } = await jwtVerify(token, JWKS);

      if (payload.typ !== 'ai_agent') {
        throw new UnauthorizedException('Token is not for AI agent');
      }

      if (!payload.agent_id) {
        throw new UnauthorizedException('Invalid AI agent token');
      }

      const application = await this.prisma.application.findFirst({
        where: {
          clientId: payload.agent_id as string,
          isAiAgent: true,
          status: 'ACTIVE',
        },
      });

      if (!application) {
        throw new UnauthorizedException('AI agent application not found or inactive');
      }

      request.agent = {
        id: payload.agent_id,
        scopes: (payload.scope as string)?.split(' ') || [],
        version: payload.agent_version,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractBearerToken(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private async getJWKSUrl(): Promise<string> {
    const baseUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
    return `${baseUrl}/.well-known/jwks.json`;
  }
}
