import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, HttpCode } from '@nestjs/common';
import { SCIMService } from '../services/scim.service';

@Controller('scim/v2/:orgId')
export class SCIMController {
    constructor(private scimService: SCIMService) { }

    @Get('Users')
    async getUsers(
        @Param('orgId') orgId: string,
        @Query('filter') filter: string,
        @Req() req: any
    ) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(orgId, token);

        const users = await this.scimService.getUsers(orgId, filter);
        return {
            schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
            totalResults: users.length,
            Resources: users.map(u => ({
                id: u.id,
                userName: u.email,
                name: { givenName: u.firstName, familyName: u.lastName },
                emails: [{ value: u.email, primary: true }],
            })),
        };
    }

    @Post('Users')
    @HttpCode(201)
    async createUser(@Param('orgId') orgId: string, @Body() body: any, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(orgId, token);

        const user = await this.scimService.createUser(orgId, body);
        return {
            id: user.id,
            userName: user.email,
            // ... SCIM response
        };
    }
}
