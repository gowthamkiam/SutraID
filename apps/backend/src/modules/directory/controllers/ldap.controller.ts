import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LDAPService } from '../services/ldap.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('directory/ldap')
@UseGuards(JwtAuthGuard)
export class LDAPController {
    constructor(private ldapService: LDAPService) { }

    @Get('config')
    async getConfig() {
        return this.ldapService.getConfig();
    }

    @Post('sync')
    async triggerSync() {
        await this.ldapService.sync();
        return { status: 'Sync initiated' };
    }

    @Post('config')
    async updateConfig(@Body() body: any) {
        return this.ldapService.updateConfig(body);
    }
}
