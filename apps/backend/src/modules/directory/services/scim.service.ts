import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SCIMService {
    constructor(private prisma: PrismaService) { }

    async validateToken(organizationId: string, token: string) {
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
