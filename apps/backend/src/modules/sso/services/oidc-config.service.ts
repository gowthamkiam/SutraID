import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateOidcScopeDto,
    CreateOidcClaimDto,
    CreateOidcRegexRuleDto,
    CreateOidcSigningKeyDto,
    UpdateOidcTokenPolicyDto,
} from '../dto/oidc-config.dto';

@Injectable()
export class OidcConfigService {
    constructor(private prisma: PrismaService) { }

    // Scopes
    async createScope(applicationId: string, dto: CreateOidcScopeDto) {
        return this.prisma.oidcScope.create({
            data: { ...dto, applicationId },
        });
    }

    async getScopes(applicationId: string) {
        return this.prisma.oidcScope.findMany({
            where: { applicationId },
        });
    }

    // Claims
    async createClaim(applicationId: string, dto: CreateOidcClaimDto) {
        return this.prisma.oidcClaim.create({
            data: { ...dto, applicationId },
        });
    }

    async getClaims(applicationId: string) {
        return this.prisma.oidcClaim.findMany({
            where: { applicationId },
            include: { regexRule: true },
        });
    }

    // Regex Rules
    async createRegexRule(applicationId: string, dto: CreateOidcRegexRuleDto) {
        return this.prisma.oidcRegexRule.create({
            data: { ...dto, applicationId },
        });
    }

    async getRegexRules(applicationId: string) {
        return this.prisma.oidcRegexRule.findMany({
            where: { applicationId },
        });
    }

    // Signing Keys
    async createSigningKey(applicationId: string, dto: CreateOidcSigningKeyDto) {
        // Encrypt private key should be done here in a real app
        return this.prisma.oidcSigningKey.create({
            data: { ...dto, applicationId },
        });
    }

    async getSigningKeys(applicationId: string) {
        return this.prisma.oidcSigningKey.findMany({
            where: { applicationId },
            select: {
                id: true,
                kid: true,
                algorithm: true,
                publicKey: true,
                certChain: true,
                isDefault: true,
                createdAt: true,
            },
        });
    }

    // Token Policy
    async updateTokenPolicy(applicationId: string, dto: UpdateOidcTokenPolicyDto) {
        return this.prisma.oidcTokenPolicy.upsert({
            where: { applicationId },
            create: { ...dto, applicationId },
            update: dto,
        });
    }

    async getTokenPolicy(applicationId: string) {
        let policy = await this.prisma.oidcTokenPolicy.findUnique({
            where: { applicationId },
        });

        if (!policy) {
            // Return default policy
            policy = await this.prisma.oidcTokenPolicy.create({
                data: { applicationId },
            });
        }

        return policy;
    }

    // Unified Config
    async getConfig(applicationId: string) {
        const [scopes, claims, regexRules, signingKeys, tokenPolicy] = await Promise.all([
            this.getScopes(applicationId),
            this.getClaims(applicationId),
            this.getRegexRules(applicationId),
            this.getSigningKeys(applicationId),
            this.getTokenPolicy(applicationId),
        ]);

        return {
            scopes,
            claims,
            regexRules,
            signingKeys,
            tokenPolicy,
        };
    }
}
