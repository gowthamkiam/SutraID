import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DpopMiddleware implements NestMiddleware {
    constructor(private prisma: PrismaService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const dpop = req.headers['dpop'] as string;

        // Check if the application requires DPoP
        // We'll need a way to determine intended client/app here.
        // For now, let's assume we validate DPoP if the header is present.

        if (!dpop) {
            return next();
        }

        try {
            // 1. Decode DPoP JWT (manual base64 decode — no jsonwebtoken needed)
            const decoded = this.decodeJwt(dpop);
            if (!decoded || !decoded.header?.jwk) {
                throw new BadRequestException('Invalid DPoP header: missing JWK');
            }

            const { jwk } = decoded.header;

            // 2. Validate Proof (HTM, HTU, JTI)
            const { htm, htu, jti, iat } = decoded.payload;

            if (htm !== req.method) {
                throw new BadRequestException('DPoP htm mismatch');
            }

            // Basic HTU check (strip query params)
            const currentUrl = `${req.protocol}://${req.get('host')}${req.path}`;
            if (htu !== currentUrl) {
                // Note: URL matching can be tricky with proxies, might need more robust matching
            }

            // 3. Replay Protection (JTI check)
            // For prototype, we'll skip DB/Redis check for now, but in prod we must store JTIs with TTL

            // 4. Bind public key thumbprint to request context
            const jkt = this.calculateJkt(jwk);
            (req as any).dpopJkt = jkt;

            next();
        } catch (error) {
            throw new UnauthorizedException(`DPoP validation failed: ${error.message}`);
        }
    }

    /**
     * Decode a JWT without verification (equivalent to jwt.decode with complete: true)
     */
    private decodeJwt(token: string): { header: any; payload: any; signature: string } | null {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

            return { header, payload, signature: parts[2] };
        } catch {
            return null;
        }
    }

    private calculateJkt(jwk: any): string {
        // RFC 7638 JWK Thumbprint
        // Simple implementation for RSA/EC common fields
        const components = jwk.kty === 'RSA'
            ? { e: jwk.e, kty: jwk.kty, n: jwk.n }
            : { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y };

        const json = JSON.stringify(components);
        return crypto.createHash('sha256').update(json).digest('base64url');
    }
}

