import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/services/auth.service';
import { OnboardDto } from './dto/onboard.dto';
import { ApplicationService } from '../application/application.service';
import { OrgRole } from '@prisma/client';

@Injectable()
export class OnboardService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
        private readonly applicationService: ApplicationService,
    ) { }

    async onboard(dto: OnboardDto) {
        const { organization, application, adminEmail } = dto;

        // 1. Check if organization slug exists
        const existingOrg = await this.prisma.organization.findUnique({
            where: { slug: organization.slug },
        });
        if (existingOrg) {
            throw new ConflictException('Organization slug is already taken');
        }

        try {
            // 2. Find or create the user via prisma transaction or sequenced queries
            // We'll do it sequentially to handle authService correctly, or just use prisma directly
            let user = await this.prisma.user.findUnique({ where: { email: adminEmail } });
            if (!user) {
                user = await this.prisma.user.create({
                    data: {
                        email: adminEmail,
                        emailVerified: false,
                        status: 'ACTIVE',
                    },
                });
            }

            // 3. Create the Organization
            const org = await this.prisma.organization.create({
                data: {
                    name: organization.name,
                    slug: organization.slug,
                    primaryColor: organization.primaryColor,
                    // 4. Create Member relation via nested create
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

            // 5. Create Application if provided
            let appResult = null;
            if (application) {
                appResult = await this.applicationService.create(org.id, user.id, {
                    name: application.name,
                    type: application.type,
                    redirectUris: application.redirectUris,
                });
            }

            // 6. Trigger a Magic Link to log them in
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
