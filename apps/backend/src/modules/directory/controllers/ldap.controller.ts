import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { LDAPService } from '../services/ldap.service';

@Controller('directory/ldap/:orgId')
export class LDAPController {
    constructor(private ldapService: LDAPService) { }

    @Post('sync')
    async triggerSync(@Param('orgId') orgId: string) {
        // Requires Admin Role check in production
        await this.ldapService.syncOrganization(orgId);
        return { status: 'Sync initiated' };
    }

    @Post('config')
    async updateConfig(@Param('orgId') orgId: string, @Body() body: any) {
        return this.ldapService.updateConfig(orgId, body);
    }
}
