import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OnboardService } from './onboard.service';
import { OnboardDto } from './dto/onboard.dto';
import { AuthRateLimitGuard } from '../auth/guards/auth-rate-limit.guard';

@Controller('onboard')
export class OnboardController {
    constructor(private readonly onboardService: OnboardService) { }

    @Post()
    @UseGuards(AuthRateLimitGuard)
    @Throttle({ default: { limit: 5, ttl: 300000 } })
    @HttpCode(HttpStatus.CREATED)
    async onboard(@Body() dto: OnboardDto) {
        throw new ForbiddenException('Self-onboarding is currently disabled.');
    }
}
