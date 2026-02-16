import {
    Controller,
    Get,
    Put,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { OrganizationSettingsService } from './organization-settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('organizations/:orgId/settings')
@UseGuards(JwtAuthGuard)
export class OrganizationSettingsController {
    constructor(private readonly settingsService: OrganizationSettingsService) { }

    @Get()
    async getSettings(
        @Param('orgId') orgId: string,
        @Request() req: any,
    ) {
        return this.settingsService.findAll(orgId, req.user.id);
    }

    @Put()
    async updateSettings(
        @Param('orgId') orgId: string,
        @Request() req: any,
        @Body() settings: Record<string, string>,
    ) {
        return this.settingsService.updateBatch(orgId, req.user.id, settings);
    }
}
