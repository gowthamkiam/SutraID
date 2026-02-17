import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { LDAPService } from '../services/ldap.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('directory/ldap/:orgId')
@UseGuards(JwtAuthGuard)
export class LDAPController {
    constructor(private ldapService: LDAPService) { }

    @Get('config')
    async getConfig(@Param('orgId') orgId: string, @Req() req: any) {
        return this.ldapService.getConfig(orgId, req.user.id);
    }

    @Post('sync')
    async triggerSync(@Param('orgId') orgId: string, @Req() req: any) {
        await this.ldapService.syncOrganization(orgId, req.user.id);
        return { status: 'Sync initiated' };
    }

    @Post('config')
    async updateConfig(@Param('orgId') orgId: string, @Body() body: any, @Req() req: any) {
        return this.ldapService.updateConfig(orgId, req.user.id, body);
    }
}
