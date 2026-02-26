import { Module } from '@nestjs/common';
import { OnboardController } from './onboard.controller';
import { OnboardService } from './onboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ApplicationModule } from '../application/application.module';

@Module({
    imports: [PrismaModule, AuthModule, ApplicationModule],
    controllers: [OnboardController],
    providers: [OnboardService],
})
export class OnboardModule { }
