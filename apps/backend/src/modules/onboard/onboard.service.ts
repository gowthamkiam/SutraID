import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/services/auth.service';
import { OnboardDto } from './dto/onboard.dto';
import { OrgRole } from '@prisma/client';

@Injectable()
export class OnboardService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
    ) { }

    async onboard(dto: OnboardDto) {
        const { adminEmail } = dto;

        const existingUser = await this.prisma.user.findUnique({
            where: { email: adminEmail },
        });

        if (existingUser) {
            throw new ConflictException('Admin user already exists');
        }

        try {
            const user = await this.prisma.user.create({
                data: {
                    email: adminEmail,
                    emailVerified: false,
                    status: 'ACTIVE',
                    role: OrgRole.SUPER_ADMIN,
                },
            });

            await this.prisma.appConfig.upsert({
                where: { id: 'singleton' },
                create: {
                    id: 'singleton',
                    name: 'SutraID',
                    primaryColor: '#000000',
                    allowedDomains: [],
                    mfaRequired: false,
                    mfaGracePeriodDays: 7,
                },
                update: {},
            });

            await this.authService.requestMagicLink(adminEmail);

            return {
                message: 'Onboarding complete. Magic link sent to admin email.',
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
            };
        } catch (e: any) {
            console.error('Failed to complete onboarding', e);
            throw new InternalServerErrorException('Failed to complete onboarding: ' + e.message);
        }
    }
}
