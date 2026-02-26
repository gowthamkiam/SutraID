import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { generateKeyPair, exportJWK } from 'jose';

@Injectable()
export class ApplicationUtils {
    /**
     * Generate a secure random client ID with a prefix
     */
    generateClientId(prefix: string = 'app_'): string {
        return `${prefix}${crypto.randomBytes(16).toString('hex')}`;
    }

    /**
     * Generate a secure random client secret
     */
    generateClientSecret(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Hash a secret using SHA-256
     */
    hashSecret(secret: string): string {
        return crypto.createHash('sha256').update(secret).digest('hex');
    }

    /**
     * Generate a self-signed X.509 certificate and private key for SAML IdP
     * Note: In a production environment, you might use a library like node-forge 
     * or a certificate authority service.
     */
    async generateSigningKeyPair(algorithm: 'RS256' | 'ES256' = 'RS256') {
        const { publicKey, privateKey } = await generateKeyPair(algorithm);
        const publicJwk = await exportJWK(publicKey);
        const privateJwk = await exportJWK(privateKey);
        const kid = `sig-${crypto.randomBytes(8).toString('hex')}`;
        return {
            kid,
            algorithm,
            publicKey: JSON.stringify(publicJwk),
            privateKey: JSON.stringify({ ...privateJwk, kid, alg: algorithm, use: 'sig' }),
        };
    }

    generateSamlCertificates() {
        // This is a placeholder for actual certificate generation logic.
        // In a real implementation, you would use node-forge or similar.
        const privateKey = '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----';
        const certificate = '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----';

        return { privateKey, certificate };
    }
}
