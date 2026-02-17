import {
    Body,
    Controller,
    Delete,
    Get,
    Header,
    HttpCode,
    Param,
    Patch,
    Post,
    Query,
    Req,
} from '@nestjs/common';
import { SCIMService } from '../services/scim.service';

@Controller('scim/v2/:orgRef')
export class SCIMController {
    constructor(private scimService: SCIMService) { }

    @Get()
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
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
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
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
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async schemas(@Param('orgRef') orgRef: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);

        return {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            totalResults: 2,
            Resources: [
                {
                    id: 'urn:ietf:params:scim:schemas:core:2.0:User',
                    name: 'User',
                    description: 'User Account',
                },
                {
                    id: 'urn:ietf:params:scim:schemas:core:2.0:Group',
                    name: 'Group',
                    description: 'Group',
                },
            ],
        };
    }

    @Get('ResourceTypes')
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async resourceTypes(@Param('orgRef') orgRef: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);

        return {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            totalResults: 2,
            Resources: [
                {
                    id: 'User',
                    name: 'User',
                    endpoint: '/Users',
                    schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
                },
                {
                    id: 'Group',
                    name: 'Group',
                    endpoint: '/Groups',
                    schema: 'urn:ietf:params:scim:schemas:core:2.0:Group',
                },
            ],
        };
    }

    @Get('Users')
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async getUsers(
        @Param('orgRef') orgRef: string,
        @Query('filter') filter: string,
        @Req() req: any,
        @Query('startIndex') startIndex?: string,
        @Query('count') count?: string,
    ) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);

        const resources = await this.scimService.getUsers(orgId, filter, Number(startIndex || 1), Number(count || 100));
        return {
            schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
            totalResults: resources.length,
            startIndex: Number(startIndex || 1),
            itemsPerPage: resources.length,
            Resources: resources,
        };
    }

    @Get('Users/:userId')
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async getUserById(@Param('orgRef') orgRef: string, @Param('userId') userId: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);
        return this.scimService.getUserResource(orgId, userId);
    }

    @Post('Users')
    @HttpCode(201)
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async createUser(@Param('orgRef') orgRef: string, @Body() body: any, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);

        return this.scimService.createUser(orgId, body);
    }

    @Patch('Users/:userId')
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async patchUser(
        @Param('orgRef') orgRef: string,
        @Param('userId') userId: string,
        @Body() body: any,
        @Req() req: any,
    ) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);
        return this.scimService.patchUser(orgId, userId, body);
    }

    @Delete('Users/:userId')
    @HttpCode(204)
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async deleteUser(@Param('orgRef') orgRef: string, @Param('userId') userId: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);
        await this.scimService.deleteUser(orgId, userId);
    }

    @Get('Groups')
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async getGroups(
        @Param('orgRef') orgRef: string,
        @Query('filter') filter: string,
        @Req() req: any,
        @Query('startIndex') startIndex?: string,
        @Query('count') count?: string,
    ) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);
        return this.scimService.getGroups(orgId, filter, Number(startIndex || 1), Number(count || 100));
    }

    @Get('Groups/:groupId')
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async getGroupById(@Param('orgRef') orgRef: string, @Param('groupId') groupId: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);
        return this.scimService.getGroupResource(orgId, groupId);
    }

    @Post('Groups')
    @HttpCode(201)
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async createGroup(@Param('orgRef') orgRef: string, @Body() body: any, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);
        return this.scimService.createGroup(orgId, body);
    }

    @Patch('Groups/:groupId')
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async patchGroup(
        @Param('orgRef') orgRef: string,
        @Param('groupId') groupId: string,
        @Body() body: any,
        @Req() req: any,
    ) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);
        return this.scimService.patchGroup(orgId, groupId, body);
    }

    @Delete('Groups/:groupId')
    @HttpCode(204)
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async deleteGroup(@Param('orgRef') orgRef: string, @Param('groupId') groupId: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        const orgId = await this.scimService.resolveOrganizationId(orgRef);
        await this.scimService.validateToken(orgId, token);
        await this.scimService.deleteGroup(orgId, groupId);
    }
}
