import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgRole } from '@prisma/client';
import { OrganizationService } from '../../organization/organization.service';
// import * as ldap from 'ldapjs'; // Assuming ldapjs is available

@Injectable()
export class LDAPService {
    constructor(
        private prisma: PrismaService,
        private organizationService: OrganizationService,
    ) { }

    private normalizeConfigInput(data: any) {
        return {
            enabled: data.enabled ?? true,
            ldapUrl: data.ldapUrl ?? data.url ?? null,
            ldapBaseDn: data.ldapBaseDn ?? data.baseDn ?? null,
            ldapBindDn: data.ldapBindDn ?? data.bindDn ?? null,
            ldapBindPassword: data.ldapBindPassword ?? data.bindPassword ?? null,
            ldapUserFilter: data.ldapUserFilter ?? data.userFilter ?? '(objectClass=user)',
            ldapGroupFilter: data.ldapGroupFilter ?? data.groupFilter ?? '(objectClass=group)',
        };
    }

    async getConfig(organizationId: string, actorId: string) {
        await this.organizationService.checkPermission(organizationId, actorId, [
            OrgRole.SUPER_ADMIN,
            OrgRole.ORG_ADMIN,
            OrgRole.READ_ONLY_ADMIN,
            OrgRole.USER_ADMIN,
            OrgRole.GROUP_MEMBERSHIP_ADMIN,
            OrgRole.HELP_DESK_ADMIN,
            OrgRole.API_ACCESS_MANAGEMENT_ADMIN,
        ]);

        const config = await this.prisma.directoryConfig.findUnique({
            where: { organizationId },
        });

        if (!config || config.type !== 'LDAP') {
            return null;
        }

        return {
            enabled: config.enabled,
            url: config.ldapUrl || '',
            baseDn: config.ldapBaseDn || '',
            bindDn: config.ldapBindDn || '',
            bindPassword: config.ldapBindPassword || '',
            userFilter: config.ldapUserFilter || '(objectClass=user)',
            groupFilter: config.ldapGroupFilter || '(objectClass=group)',
            lastSyncAt: config.lastSyncAt,
        };
    }

    async updateConfig(organizationId: string, actorId: string, data: any) {
        await this.organizationService.checkPermission(organizationId, actorId, [
            OrgRole.SUPER_ADMIN,
            OrgRole.ORG_ADMIN,
        ]);
        const normalized = this.normalizeConfigInput(data);

        return this.prisma.directoryConfig.upsert({
            where: { organizationId },
            create: {
                organizationId,
                type: 'LDAP',
                ...normalized,
            },
            update: {
                type: 'LDAP',
                ...normalized,
            },
        });
    }

    async syncOrganization(organizationId: string, actorId: string) {
        await this.organizationService.checkPermission(organizationId, actorId, [
            OrgRole.SUPER_ADMIN,
            OrgRole.ORG_ADMIN,
        ]);
        const config = await this.prisma.directoryConfig.findUnique({
            where: { organizationId },
        });

        if (!config || config.type !== 'LDAP' || !config.enabled) return;

        // Outbound LDAP Sync Logic (Pseudocode for connectivity)
        // 1. Create client: ldap.createClient({ url: config.ldapUrl })
        // 2. Bind: client.bind(config.ldapBindDn, password, ...)
        // 3. Search Users: client.search(config.ldapBaseDn, { filter: config.ldapUserFilter, scope: 'sub' })
        // 4. Map & Upsert Users in DB
        // 5. Search Groups: client.search(config.ldapBaseDn, { filter: config.ldapGroupFilter, scope: 'sub' })
        // 6. Sync Group Memberships

        await this.prisma.directoryConfig.update({
            where: { id: config.id },
            data: { lastSyncAt: new Date() },
        });
    }
}
