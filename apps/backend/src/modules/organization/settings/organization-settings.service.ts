import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgRole, OrganizationSetting } from '@prisma/client';
import { OrganizationService } from '../organization.service';

@Injectable()
export class OrganizationSettingsService {
    constructor(
        private prisma: PrismaService,
        private organizationService: OrganizationService,
    ) { }

    /**
     * Get all settings for an organization
     */
    async findAll(orgId: string, actorId: string) {
        // Check permission (Admins only)
        await this.organizationService.checkPermission(orgId, actorId, [
            // @ts-ignore
            OrgRole.SUPER_ADMIN,
            // @ts-ignore
            OrgRole.ORG_ADMIN,
        ]);

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
    async update(orgId: string, actorId: string, key: string, value: string) {
        // Check permission (Admins only)
        await this.organizationService.checkPermission(orgId, actorId, [
            // @ts-ignore
            OrgRole.SUPER_ADMIN,
            // @ts-ignore
            OrgRole.ORG_ADMIN,
        ]);

        return this.prisma.organizationSetting.upsert({
            where: {
                organizationId_key: {
                    organizationId: orgId,
                    key,
                },
            },
            update: {
                value,
                updatedBy: actorId,
            },
            create: {
                organizationId: orgId,
                key,
                value,
                updatedBy: actorId,
            },
        });
    }

    /**
     * Batch update settings
     */
    async updateBatch(orgId: string, actorId: string, settings: Record<string, string>) {
        // Check permission (Admins only)
        await this.organizationService.checkPermission(orgId, actorId, [
            // @ts-ignore
            OrgRole.SUPER_ADMIN,
            // @ts-ignore
            OrgRole.ORG_ADMIN,
        ]);

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
                    updatedBy: actorId,
                },
                create: {
                    organizationId: orgId,
                    key,
                    value,
                    updatedBy: actorId,
                },
            }),
        );

        await this.prisma.$transaction(operations);

        return this.findAll(orgId, actorId);
    }

}
