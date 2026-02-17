import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SCIMService {
    constructor(private prisma: PrismaService) { }

    async resolveOrganizationId(orgRef: string): Promise<string> {
        const normalizedRef = (orgRef || '').trim();
        if (!normalizedRef) {
            throw new NotFoundException('Organization not found');
        }

        // UUID input
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(normalizedRef)) {
            return normalizedRef;
        }

        // Support legacy "org_<slug_like>" references.
        const legacyCandidate = normalizedRef.startsWith('org_')
            ? normalizedRef.slice(4).replace(/_/g, '-')
            : normalizedRef;

        const organization = await this.prisma.organization.findFirst({
            where: {
                OR: [
                    { slug: normalizedRef },
                    { slug: legacyCandidate },
                    { name: normalizedRef },
                    { name: legacyCandidate },
                ],
            },
            select: { id: true },
        });

        if (!organization) {
            throw new NotFoundException('Organization not found');
        }

        return organization.id;
    }

    async validateToken(organizationId: string, token: string) {
        if (!token) {
            throw new UnauthorizedException('Missing SCIM token');
        }

        const config = await this.prisma.directoryConfig.findUnique({
            where: { organizationId },
        });

        if (!config || !config.scimToken || config.type !== 'SCIM' || !config.enabled) {
            throw new UnauthorizedException('SCIM not enabled or configured for this organization');
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        if (config.scimToken !== hashedToken) {
            throw new UnauthorizedException('Invalid SCIM token');
        }

        return config;
    }

    async generateToken(organizationId: string): Promise<{ token: string }> {
        const token = `st_live_${crypto.randomBytes(24).toString('hex')}`;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        await this.prisma.directoryConfig.upsert({
            where: { organizationId },
            update: {
                type: 'SCIM',
                enabled: true,
                scimToken: hashedToken,
            },
            create: {
                organizationId,
                type: 'SCIM',
                enabled: true,
                scimToken: hashedToken,
            },
        });

        return { token };
    }

    async getUsers(organizationId: string, filter?: string) {
        // Basic SCIM 2.0 user listing
        return this.prisma.user.findMany({
            where: {
                organizationMembers: { some: { organizationId } },
                // filter logic here
            },
        });
    }

    async createUser(organizationId: string, scimUser: any) {
        const email = scimUser.emails?.[0]?.value;
        if (!email) throw new Error('Email is required');

        return this.prisma.$transaction(async (tx) => {
            let user = await tx.user.findUnique({ where: { email } });

            if (!user) {
                user = await tx.user.create({
                    data: {
                        email,
                        firstName: scimUser.name?.givenName,
                        lastName: scimUser.name?.familyName,
                        externalId: scimUser.id,
                        status: 'ACTIVE',
                    },
                });
            }

            await tx.organizationMember.upsert({
                where: { organizationId_userId: { organizationId, userId: user.id } },
                create: { organizationId, userId: user.id, role: 'READ_ONLY_ADMIN' },
                update: { status: 'ACTIVE' },
            });

            return user;
        });
    }

    async patchUser(organizationId: string, userId: string, patch: any) {
        // SCIM PATCH implementation
    }

    async deleteUser(organizationId: string, userId: string) {
        return this.prisma.organizationMember.update({
            where: { organizationId_userId: { organizationId, userId } },
            data: { status: 'SUSPENDED' },
        });
    }
}
