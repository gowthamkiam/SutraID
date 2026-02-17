import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

    async getUsers(organizationId: string, filter?: string, startIndex = 1, count = 100) {
        const value = this.parseEqFilterValue(filter);
        const normalizedFilter = filter?.toLowerCase() || '';
        const where: any = {
            organizationMembers: { some: { organizationId } },
        };

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

    async getUserResource(organizationId: string, userId: string) {
        const member = await this.prisma.organizationMember.findUnique({
            where: { organizationId_userId: { organizationId, userId } },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        status: true,
                        externalId: true,
                        agentMetadata: true,
                    },
                },
            },
        });
        if (!member) {
            throw new NotFoundException('User not found');
        }
        return this.mapUserToScim(member.user);
    }

    async createUser(organizationId: string, scimUser: any) {
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
                          organizationId,
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

            await tx.organizationMember.upsert({
                where: { organizationId_userId: { organizationId, userId: userRecord.id } },
                create: {
                    organizationId,
                    userId: userRecord.id,
                    role: 'READ_ONLY_ADMIN',
                    status: active ? 'ACTIVE' : 'SUSPENDED',
                },
                update: {
                    status: active ? 'ACTIVE' : 'SUSPENDED',
                },
            });

            return userRecord;
        });

        return this.getUserResource(organizationId, user.id);
    }

    async patchUser(organizationId: string, userId: string, patch: any) {
        const member = await this.prisma.organizationMember.findUnique({
            where: { organizationId_userId: { organizationId, userId } },
            include: { user: true },
        });
        if (!member) {
            throw new NotFoundException('User not found');
        }

        const data: any = {};
        let memberStatus: 'ACTIVE' | 'SUSPENDED' | undefined;
        const metadata = { ...((member.user.agentMetadata as any) || {}) };
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
                    memberStatus = 'SUSPENDED';
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
                memberStatus = active ? 'ACTIVE' : 'SUSPENDED';
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
                    memberStatus = value.active ? 'ACTIVE' : 'SUSPENDED';
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

        await this.prisma.$transaction(async (tx) => {
            if (Object.keys(data).length) {
                await tx.user.update({ where: { id: userId }, data });
            }
            if (memberStatus) {
                await tx.organizationMember.update({
                    where: { organizationId_userId: { organizationId, userId } },
                    data: { status: memberStatus },
                });
            }
        });

        return this.getUserResource(organizationId, userId);
    }

    async deleteUser(organizationId: string, userId: string) {
        const member = await this.prisma.organizationMember.findUnique({
            where: { organizationId_userId: { organizationId, userId } },
            select: { id: true },
        });
        if (!member) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.organizationMember.update({
            where: { organizationId_userId: { organizationId, userId } },
            data: { status: 'SUSPENDED' },
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'SUSPENDED' },
        });
    }

    async getGroups(organizationId: string, filter?: string, startIndex = 1, count = 100) {
        const value = this.parseEqFilterValue(filter);
        const normalizedFilter = filter?.toLowerCase() || '';
        const where: any = { organizationId };

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

    async getGroupResource(organizationId: string, groupId: string) {
        const group = await this.prisma.group.findFirst({
            where: { id: groupId, organizationId },
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

    async createGroup(organizationId: string, scimGroup: any) {
        const displayName = scimGroup.displayName;
        if (!displayName || typeof displayName !== 'string') {
            throw new BadRequestException('displayName is required');
        }

        const group = await this.prisma.group.create({
            data: {
                organizationId,
                name: displayName,
                externalId: scimGroup.externalId || null,
            },
        });

        if (Array.isArray(scimGroup.members) && scimGroup.members.length) {
            await this.syncGroupMembers(organizationId, group.id, scimGroup.members.map((m: any) => m.value));
        }

        return this.getGroupResource(organizationId, group.id);
    }

    private async syncGroupMembers(organizationId: string, groupId: string, userIds: string[]) {
        const validIds = [...new Set((userIds || []).filter(Boolean))];
        const existing = await this.prisma.organizationMember.findMany({
            where: {
                organizationId,
                userId: { in: validIds },
            },
            select: { userId: true },
        });
        const existingIds = new Set(existing.map((entry) => entry.userId));
        const filteredUserIds = validIds.filter((id) => existingIds.has(id));

        await this.prisma.groupMember.deleteMany({ where: { groupId } });
        if (filteredUserIds.length) {
            await this.prisma.groupMember.createMany({
                data: filteredUserIds.map((userId) => ({ groupId, userId })),
                skipDuplicates: true,
            });
        }
    }

    async patchGroup(organizationId: string, groupId: string, patch: any) {
        const group = await this.prisma.group.findFirst({
            where: { id: groupId, organizationId },
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

        await this.syncGroupMembers(organizationId, groupId, [...nextMemberIds]);
        return this.getGroupResource(organizationId, groupId);
    }

    async deleteGroup(organizationId: string, groupId: string) {
        const group = await this.prisma.group.findFirst({
            where: { id: groupId, organizationId },
            select: { id: true },
        });
        if (!group) {
            throw new NotFoundException('Group not found');
        }
        await this.prisma.group.delete({ where: { id: groupId } });
    }
}
