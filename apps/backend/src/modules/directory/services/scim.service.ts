import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class SCIMService {
    constructor(private prisma: PrismaService) { }

    async validateToken(token: string) {
        if (!token) {
            throw new UnauthorizedException('Missing SCIM token');
        }

        const config = await this.prisma.directoryConfig.findFirst({
            where: {
                type: 'SCIM',
                enabled: true,
            },
        });

        if (!config || !config.scimToken) {
            throw new UnauthorizedException('SCIM not enabled or configured');
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        if (config.scimToken !== hashedToken) {
            throw new UnauthorizedException('Invalid SCIM token');
        }

        return config;
    }

    async generateToken(): Promise<{ token: string }> {
        const token = `st_live_${crypto.randomBytes(24).toString('hex')}`;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const existingConfig = await this.prisma.directoryConfig.findFirst({
            where: { type: 'SCIM' },
        });

        if (existingConfig) {
            await this.prisma.directoryConfig.update({
                where: { id: existingConfig.id },
                data: {
                    enabled: true,
                    scimToken: hashedToken,
                },
            });
        } else {
            await this.prisma.directoryConfig.create({
                data: {
                    type: 'SCIM',
                    enabled: true,
                    scimToken: hashedToken,
                },
            });
        }

        return { token };
    }

    private parseEqFilterValue(filter?: string): string | null {
        if (!filter) return null;
        const match = filter.match(/eq\s+"([^"]+)"/i);
        return match?.[1] || null;
    }

    private mapUserToScim(user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        status: string;
        externalId: string | null;
        agentMetadata?: any;
    }) {
        const enterpriseExtension = user.agentMetadata?.scimEnterprise;
        return {
            schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
            id: user.id,
            userName: user.email,
            externalId: user.externalId || undefined,
            name: {
                givenName: user.firstName || '',
                familyName: user.lastName || '',
            },
            emails: [{ value: user.email, primary: true, type: 'work' }],
            active: user.status === 'ACTIVE',
            ...(enterpriseExtension
                ? { 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User': enterpriseExtension }
                : {}),
        };
    }

    private mapGroupToScim(group: {
        id: string;
        displayName: string;
        externalId: string | null;
        members: Array<{ value: string; display: string }>;
    }) {
        return {
            schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
            id: group.id,
            displayName: group.displayName,
            externalId: group.externalId || undefined,
            members: group.members,
        };
    }

    async getUsers(filter?: string, startIndex = 1, count = 100) {
        const value = this.parseEqFilterValue(filter);
        const normalizedFilter = filter?.toLowerCase() || '';
        const where: any = {};

        if (value) {
            if (normalizedFilter.includes('username')) {
                where.email = value;
            } else if (normalizedFilter.includes('externalid')) {
                where.externalId = value;
            } else if (normalizedFilter.includes('id')) {
                where.id = value;
            }
        }

        const users = await this.prisma.user.findMany({
            where,
            orderBy: { createdAt: 'asc' },
            skip: Math.max(0, startIndex - 1),
            take: Math.max(1, Math.min(count, 200)),
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                externalId: true,
                agentMetadata: true,
            },
        });

        return users.map((user) => this.mapUserToScim(user));
    }

    async getUserResource(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                externalId: true,
                agentMetadata: true,
            },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return this.mapUserToScim(user);
    }

    async createUser(scimUser: any) {
        const email =
            scimUser.userName ||
            scimUser.emails?.find((entry: any) => entry?.value)?.value;
        if (!email) {
            throw new BadRequestException('userName or emails[0].value is required');
        }

        const active = scimUser.active !== false;
        const user = await this.prisma.$transaction(async (tx) => {
            const existing = await tx.user.findUnique({ where: { email } });

            const userRecord = existing
                ? await tx.user.update({
                      where: { id: existing.id },
                      data: {
                          firstName: scimUser.name?.givenName ?? existing.firstName,
                          lastName: scimUser.name?.familyName ?? existing.lastName,
                          externalId: scimUser.externalId ?? existing.externalId,
                          status: active ? 'ACTIVE' : 'SUSPENDED',
                          agentMetadata: {
                              ...(((existing.agentMetadata as any) || {})),
                              ...(scimUser['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User']
                                  ? { scimEnterprise: scimUser['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'] }
                                  : {}),
                          },
                      },
                  })
                : await tx.user.create({
                      data: {
                          email,
                          role: 'READ_ONLY_ADMIN',
                          firstName: scimUser.name?.givenName ?? null,
                          lastName: scimUser.name?.familyName ?? null,
                          externalId: scimUser.externalId ?? null,
                          status: active ? 'ACTIVE' : 'SUSPENDED',
                          agentMetadata: scimUser['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User']
                              ? { scimEnterprise: scimUser['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'] }
                              : {},
                      },
                  });

            return userRecord;
        });

        return this.getUserResource(user.id);
    }

    async patchUser(userId: string, patch: any) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const data: any = {};
        const metadata = { ...((user.agentMetadata as any) || {}) };
        const enterpriseKey = 'urn:ietf:params:scim:schemas:extension:enterprise:2.0:user';

        const operations: any[] = patch?.Operations || [];
        for (const operation of operations) {
            const op = (operation?.op || '').toLowerCase();
            const path = (operation?.path || '').toLowerCase();
            const value = operation?.value;

            if (op === 'remove') {
                if (path.includes('name.givenname')) data.firstName = null;
                if (path.includes('name.familyname')) data.lastName = null;
                if (path.includes('active')) {
                    data.status = 'SUSPENDED';
                }
                if (path.includes(`${enterpriseKey}:manager`) || path === `${enterpriseKey}`) {
                    const currentEnterprise = { ...(metadata.scimEnterprise || {}) };
                    delete currentEnterprise.manager;
                    metadata.scimEnterprise = currentEnterprise;
                }
                continue;
            }

            if (path === 'username' && typeof value === 'string') data.email = value;
            if (path === 'name.givenname' && typeof value === 'string') data.firstName = value;
            if (path === 'name.familyname' && typeof value === 'string') data.lastName = value;
            if (path === 'externalid' && typeof value === 'string') data.externalId = value;
            if (path === 'active') {
                const active = value !== false;
                data.status = active ? 'ACTIVE' : 'SUSPENDED';
            }
            if (path.includes(`${enterpriseKey}:manager`) && value && typeof value === 'object') {
                metadata.scimEnterprise = {
                    ...(metadata.scimEnterprise || {}),
                    manager: value,
                };
            }
            if (path === enterpriseKey && value && typeof value === 'object') {
                metadata.scimEnterprise = {
                    ...(metadata.scimEnterprise || {}),
                    ...value,
                };
            }

            if (!path && value && typeof value === 'object') {
                if (typeof value.userName === 'string') data.email = value.userName;
                if (typeof value.active === 'boolean') {
                    data.status = value.active ? 'ACTIVE' : 'SUSPENDED';
                }
                if (value.name?.givenName) data.firstName = value.name.givenName;
                if (value.name?.familyName) data.lastName = value.name.familyName;
                if (value.externalId) data.externalId = value.externalId;
                if (value['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User']) {
                    metadata.scimEnterprise = value['urn:ietf:params:scim:schemas:extension:enterprise:2.0:User'];
                }
            }
        }
        data.agentMetadata = metadata;

        if (Object.keys(data).length) {
            await this.prisma.user.update({ where: { id: userId }, data });
        }

        return this.getUserResource(userId);
    }

    async deleteUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'SUSPENDED' },
        });
    }

    async getGroups(filter?: string, startIndex = 1, count = 100) {
        const value = this.parseEqFilterValue(filter);
        const normalizedFilter = filter?.toLowerCase() || '';
        const where: any = {};

        if (value) {
            if (normalizedFilter.includes('displayname')) where.name = value;
            else if (normalizedFilter.includes('externalid')) where.externalId = value;
            else if (normalizedFilter.includes('id')) where.id = value;
        }

        const groups = await this.prisma.group.findMany({
            where,
            orderBy: { createdAt: 'asc' },
            skip: Math.max(0, startIndex - 1),
            take: Math.max(1, Math.min(count, 200)),
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true },
                        },
                    },
                },
            },
        });

        const resources = groups.map((group) =>
            this.mapGroupToScim({
                id: group.id,
                displayName: group.name,
                externalId: group.externalId,
                members: group.members.map((entry) => ({
                    value: entry.userId,
                    display: entry.user.email,
                })),
            }),
        );

        return {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            totalResults: resources.length,
            startIndex,
            itemsPerPage: resources.length,
            Resources: resources,
        };
    }

    async getGroupResource(groupId: string) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: {
                members: {
                    include: { user: { select: { id: true, email: true } } },
                },
            },
        });
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        return this.mapGroupToScim({
            id: group.id,
            displayName: group.name,
            externalId: group.externalId,
            members: group.members.map((entry) => ({
                value: entry.userId,
                display: entry.user.email,
            })),
        });
    }

    async createGroup(scimGroup: any) {
        const displayName = scimGroup.displayName;
        if (!displayName || typeof displayName !== 'string') {
            throw new BadRequestException('displayName is required');
        }

        const group = await this.prisma.group.create({
            data: {
                name: displayName,
                externalId: scimGroup.externalId || null,
            },
        });

        if (Array.isArray(scimGroup.members) && scimGroup.members.length) {
            await this.syncGroupMembers(group.id, scimGroup.members.map((m: any) => m.value));
        }

        return this.getGroupResource(group.id);
    }

    private async syncGroupMembers(groupId: string, userIds: string[]) {
        const validIds = [...new Set((userIds || []).filter(Boolean))];
        const existing = await this.prisma.user.findMany({
            where: {
                id: { in: validIds },
            },
            select: { id: true },
        });
        const existingIds = new Set(existing.map((entry) => entry.id));
        const filteredUserIds = validIds.filter((id) => existingIds.has(id));

        await this.prisma.groupMember.deleteMany({ where: { groupId } });
        if (filteredUserIds.length) {
            await this.prisma.groupMember.createMany({
                data: filteredUserIds.map((userId) => ({ groupId, userId })),
                skipDuplicates: true,
            });
        }
    }

    async patchGroup(groupId: string, patch: any) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: { members: true },
        });
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        const operations: any[] = patch?.Operations || [];
        let nextMemberIds = new Set(group.members.map((entry) => entry.userId));

        for (const operation of operations) {
            const op = (operation?.op || '').toLowerCase();
            const path = (operation?.path || '').toLowerCase();
            const value = operation?.value;

            if ((op === 'add' || op === 'replace') && path === 'displayname' && typeof value === 'string') {
                await this.prisma.group.update({ where: { id: groupId }, data: { name: value } });
                continue;
            }

            if ((op === 'add' || op === 'replace') && (path === 'members' || !path)) {
                const membersValue = path === 'members' ? value : value?.members;
                const ids = Array.isArray(membersValue) ? membersValue.map((entry: any) => entry?.value).filter(Boolean) : [];
                if (op === 'replace') {
                    nextMemberIds = new Set(ids);
                } else {
                    ids.forEach((id: string) => nextMemberIds.add(id));
                }
                continue;
            }

            if (op === 'remove' && path === 'members') {
                nextMemberIds = new Set();
                continue;
            }

            if (op === 'remove' && path.startsWith('members[value eq')) {
                const removeValue = this.parseEqFilterValue(path);
                if (removeValue) {
                    nextMemberIds.delete(removeValue);
                }
            }
        }

        await this.syncGroupMembers(groupId, [...nextMemberIds]);
        return this.getGroupResource(groupId);
    }

    async deleteGroup(groupId: string) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            select: { id: true },
        });
        if (!group) {
            throw new NotFoundException('Group not found');
        }
        await this.prisma.group.delete({ where: { id: groupId } });
    }
}
