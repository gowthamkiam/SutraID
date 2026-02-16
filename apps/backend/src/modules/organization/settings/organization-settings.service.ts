import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgRole, MemberStatus, OrganizationSetting } from '@prisma/client';

@Injectable()
export class OrganizationSettingsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all settings for an organization
     */
    async findAll(orgId: string, userId: string) {
        // Check permission (Admins only)
        await this.checkPermission(orgId, userId, [OrgRole.OWNER, OrgRole.ADMIN]);

        const settings = await this.prisma.organizationSetting.findMany({
            where: { organizationId: orgId },
        });

        // Convert array to object for easier frontend consumption
        return settings.reduce((acc: Record<string, string>, curr: OrganizationSetting) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {} as Record<string, string>);
    }

    /**
     * Update or create a setting
     */
    async update(orgId: string, userId: string, key: string, value: string) {
        // Check permission (Admins only)
        await this.checkPermission(orgId, userId, [OrgRole.OWNER, OrgRole.ADMIN]);

        return this.prisma.organizationSetting.upsert({
            where: {
                organizationId_key: {
                    organizationId: orgId,
                    key,
                },
            },
            update: {
                value,
                updatedBy: userId,
            },
            create: {
                organizationId: orgId,
                key,
                value,
                updatedBy: userId,
            },
        });
    }

    /**
     * Batch update settings
     */
    async updateBatch(orgId: string, userId: string, settings: Record<string, string>) {
        // Check permission (Admins only)
        await this.checkPermission(orgId, userId, [OrgRole.OWNER, OrgRole.ADMIN]);

        const operations = Object.entries(settings).map(([key, value]) =>
            this.prisma.organizationSetting.upsert({
                where: {
                    organizationId_key: {
                        organizationId: orgId,
                        key,
                    },
                },
                update: {
                    value,
                    updatedBy: userId,
                },
                create: {
                    organizationId: orgId,
                    key,
                    value,
                    updatedBy: userId,
                },
            }),
        );

        await this.prisma.$transaction(operations);

        return this.findAll(orgId, userId);
    }

    /**
     * Helper to check permissions
     */
    private async checkPermission(
        orgId: string,
        userId: string,
        requiredRoles: OrgRole[],
    ) {
        const membership = await this.prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: orgId,
                    userId,
                },
            },
        });

        if (!membership || membership.status !== MemberStatus.ACTIVE) {
            throw new ForbiddenException('Access denied');
        }

        if (!requiredRoles.includes(membership.role)) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return membership;
    }
}
