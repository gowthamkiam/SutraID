import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { OnboardService } from './onboard.service';
import { OnboardDto } from './dto/onboard.dto';

@Controller('onboard')
export class OnboardController {
    constructor(private readonly onboardService: OnboardService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async onboard(@Body() dto: OnboardDto) {
        return this.onboardService.onboard(dto);
    }
}
