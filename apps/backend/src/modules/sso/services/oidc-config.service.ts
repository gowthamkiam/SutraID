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
    async createScope(organizationId: string, dto: CreateOidcScopeDto) {
        return this.prisma.oidcScope.create({
            data: { ...dto, organizationId },
        });
    }

    async getScopes(organizationId: string) {
        return this.prisma.oidcScope.findMany({
            where: { organizationId },
        });
    }

    // Claims
    async createClaim(organizationId: string, dto: CreateOidcClaimDto) {
        return this.prisma.oidcClaim.create({
            data: { ...dto, organizationId },
        });
    }

    async getClaims(organizationId: string) {
        return this.prisma.oidcClaim.findMany({
            where: { organizationId },
            include: { regexRule: true },
        });
    }

    // Regex Rules
    async createRegexRule(organizationId: string, dto: CreateOidcRegexRuleDto) {
        return this.prisma.oidcRegexRule.create({
            data: { ...dto, organizationId },
        });
    }

    async getRegexRules(organizationId: string) {
        return this.prisma.oidcRegexRule.findMany({
            where: { organizationId },
        });
    }

    // Signing Keys
    async createSigningKey(organizationId: string, dto: CreateOidcSigningKeyDto) {
        // Encrypt private key should be done here in a real app
        return this.prisma.oidcSigningKey.create({
            data: { ...dto, organizationId },
        });
    }

    async getSigningKeys(organizationId: string) {
        return this.prisma.oidcSigningKey.findMany({
            where: { organizationId },
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
    async updateTokenPolicy(organizationId: string, dto: UpdateOidcTokenPolicyDto) {
        return this.prisma.oidcTokenPolicy.upsert({
            where: { organizationId },
            create: { ...dto, organizationId },
            update: dto,
        });
    }

    async getTokenPolicy(organizationId: string) {
        let policy = await this.prisma.oidcTokenPolicy.findUnique({
            where: { organizationId },
        });

        if (!policy) {
            // Return default policy
            policy = await this.prisma.oidcTokenPolicy.create({
                data: { organizationId },
            });
        }

        return policy;
    }

    // Unified Config
    async getConfig(organizationId: string) {
        const [scopes, claims, regexRules, signingKeys, tokenPolicy] = await Promise.all([
            this.getScopes(organizationId),
            this.getClaims(organizationId),
            this.getRegexRules(organizationId),
            this.getSigningKeys(organizationId),
            this.getTokenPolicy(organizationId),
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
