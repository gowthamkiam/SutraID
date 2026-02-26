import { Injectable, ConflictException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/services/auth.service';
import { OnboardDto } from './dto/onboard.dto';
import { ApplicationService } from '../application/application.service';
import { OrgRole } from '@prisma/client';
import { extractDomainFromEmail, isFreeEmailProvider } from '../auth/utils/domain.util';

@Injectable()
export class OnboardService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
        private readonly applicationService: ApplicationService,
    ) { }

    async onboard(dto: OnboardDto) {
        const { organization, application, adminEmail } = dto;

        // 1. Check if organization slug or name exists
        const existingOrgSlug = await this.prisma.organization.findUnique({
            where: { slug: organization.slug },
        });
        if (existingOrgSlug) {
            throw new ConflictException('Organization slug is already taken');
        }

        const existingOrgName = await this.prisma.organization.findUnique({
            where: { name: organization.name },
        });
        if (existingOrgName) {
            throw new ConflictException('Organization name is already taken');
        }

        // 3. Check if admin email domain matches existing organization
        const emailDomain = extractDomainFromEmail(adminEmail);

        if (!isFreeEmailProvider(emailDomain)) {
            const existingOrg = await this.prisma.organization.findFirst({
                where: {
                    AND: [
                        {
                            OR: [
                                { domain: emailDomain },
                                { allowedDomains: { has: emailDomain } }
                            ]
                        },
                        { status: 'ACTIVE' }
                    ]
                },
                select: { id: true, name: true, slug: true }
            });

            if (existingOrg) {
                throw new ForbiddenException(
                    `Self-registration is not allowed for this organization. Please contact your organization administrator to be provisioned. Organization: ${existingOrg.name} (${existingOrg.slug})`
                );
            }
        }

        try {
            // 4. Find or create the user
            let user = await this.prisma.user.findUnique({
                where: { email: adminEmail },
                include: { organizationMembers: { where: { status: 'ACTIVE' } } },
            });

            // STRICT 1-ORG-PER-ADMIN Check
            if (user && user.organizationMembers && user.organizationMembers.length > 0) {
                throw new ConflictException('This admin email is already associated with an organization. Multiple organization ownership is not allowed.');
            }

            if (!user) {
                user = await this.prisma.user.create({
                    data: {
                        email: adminEmail,
                        emailVerified: false,
                        status: 'ACTIVE',
                    },
                }) as any;
            }

            if (!user) throw new InternalServerErrorException('Failed to create or find user');

            // 5. Create the Organization
            const org = await this.prisma.organization.create({
                data: {
                    name: organization.name,
                    slug: organization.slug,
                    primaryColor: organization.primaryColor,
                    // 6. Create Member relation via nested create
                    members: {
                        create: {
                            userId: user.id,
                            role: OrgRole.SUPER_ADMIN,
                            status: 'ACTIVE',
                            joinedAt: new Date(),
                        },
                    },
                },
            });

            // Update user's organizationId if not set
            if (!user.organizationId) {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { organizationId: org.id, role: OrgRole.SUPER_ADMIN },
                });
            }

            // 7. Create Application if provided
            let appResult = null;
            if (application) {
                appResult = await this.applicationService.create(org.id, user.id, {
                    name: application.name,
                    type: application.type,
                    redirectUris: application.redirectUris,
                });
            }

            // 8. Trigger a Magic Link to log them in
            await this.authService.requestMagicLink(adminEmail);

            return {
                message: 'Onboarding complete. Magic link sent to admin email.',
                organization: org,
                application: appResult ? { id: appResult.id, name: appResult.name } : null,
            };
        } catch (e: any) {
            console.error('Failed to complete onboarding', e);
            throw new InternalServerErrorException('Failed to complete onboarding: ' + e.message);
        }
    }
}
