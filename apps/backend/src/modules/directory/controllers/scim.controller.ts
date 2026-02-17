import { Controller, Get, Post, Body, Param, Query, Req, HttpCode } from '@nestjs/common';
import { SCIMService } from '../services/scim.service';

@Controller('scim/v2/:orgRef')
export class SCIMController {
    constructor(private scimService: SCIMService) { }

    @Get()
    async base(@Param('orgRef') orgRef: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);

        return {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            message: 'SutraID SCIM endpoint is active',
            organizationId: orgId,
        };
    }

    @Get('ServiceProviderConfig')
    async serviceProviderConfig(@Param('orgRef') orgRef: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);

        return {
            schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
            patch: { supported: true },
            bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
            filter: { supported: true, maxResults: 200 },
            changePassword: { supported: false },
            sort: { supported: true },
            etag: { supported: false },
            authenticationSchemes: [
                {
                    type: 'oauthbearertoken',
                    name: 'Bearer Token',
                    description: 'Use SCIM bearer token in Authorization header',
                    specUri: 'https://datatracker.ietf.org/doc/html/rfc6750',
                    primary: true,
                },
            ],
        };
    }

    @Get('Schemas')
    async schemas(@Param('orgRef') orgRef: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);

        return {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            totalResults: 1,
            Resources: [
                {
                    id: 'urn:ietf:params:scim:schemas:core:2.0:User',
                    name: 'User',
                    description: 'User Account',
                },
            ],
        };
    }

    @Get('ResourceTypes')
    async resourceTypes(@Param('orgRef') orgRef: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);

        return {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            totalResults: 1,
            Resources: [
                {
                    id: 'User',
                    name: 'User',
                    endpoint: '/Users',
                    schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
                },
            ],
        };
    }

    @Get('Users')
    async getUsers(
        @Param('orgRef') orgRef: string,
        @Query('filter') filter: string,
        @Req() req: any
    ) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
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
    async createUser(@Param('orgRef') orgRef: string, @Body() body: any, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);

        const user = await this.scimService.createUser(orgId, body);
        return {
            id: user.id,
            userName: user.email,
            // ... SCIM response
        };
    }
}
