import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LDAPService {
    constructor(
        private prisma: PrismaService,
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

    async getConfig() {
        const config = await this.prisma.directoryConfig.findFirst({
            where: { type: 'LDAP' },
        });

        if (!config) {
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

    async updateConfig(data: any) {
        const normalized = this.normalizeConfigInput(data);

        const existingConfig = await this.prisma.directoryConfig.findFirst({
            where: { type: 'LDAP' },
        });

        if (existingConfig) {
            return this.prisma.directoryConfig.update({
                where: { id: existingConfig.id },
                data: {
                    type: 'LDAP',
                    ...normalized,
                },
            });
        } else {
            return this.prisma.directoryConfig.create({
                data: {
                    type: 'LDAP',
                    ...normalized,
                },
            });
        }
    }

    async sync() {
        const config = await this.prisma.directoryConfig.findFirst({
            where: { type: 'LDAP' },
        });

        if (!config || !config.enabled) return;

        await this.prisma.directoryConfig.update({
            where: { id: config.id },
            data: { lastSyncAt: new Date() },
        });
    }
}
