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

@Controller('scim/v2')
export class SCIMController {
    constructor(private scimService: SCIMService) { }

    @Get()
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async base(@Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);

        return {
            schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
            message: 'SutraID SCIM endpoint is active',
        };
    }

    @Get('ServiceProviderConfig')
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async serviceProviderConfig(@Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);

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
    async schemas(@Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);

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
    async resourceTypes(@Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);

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
        @Query('filter') filter: string,
        @Req() req: any,
        @Query('startIndex') startIndex?: string,
        @Query('count') count?: string,
    ) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);

        const resources = await this.scimService.getUsers(filter, Number(startIndex || 1), Number(count || 100));
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
    async getUserById(@Param('userId') userId: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);
        return this.scimService.getUserResource(userId);
    }

    @Post('Users')
    @HttpCode(201)
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async createUser(@Body() body: any, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);

        return this.scimService.createUser(body);
    }

    @Patch('Users/:userId')
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async patchUser(
        @Param('userId') userId: string,
        @Body() body: any,
        @Req() req: any,
    ) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);
        return this.scimService.patchUser(userId, body);
    }

    @Delete('Users/:userId')
    @HttpCode(204)
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async deleteUser(@Param('userId') userId: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);
        await this.scimService.deleteUser(userId);
    }

    @Get('Groups')
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async getGroups(
        @Query('filter') filter: string,
        @Req() req: any,
        @Query('startIndex') startIndex?: string,
        @Query('count') count?: string,
    ) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);
        return this.scimService.getGroups(filter, Number(startIndex || 1), Number(count || 100));
    }

    @Get('Groups/:groupId')
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async getGroupById(@Param('groupId') groupId: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);
        return this.scimService.getGroupResource(groupId);
    }

    @Post('Groups')
    @HttpCode(201)
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async createGroup(@Body() body: any, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);
        return this.scimService.createGroup(body);
    }

    @Patch('Groups/:groupId')
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async patchGroup(
        @Param('groupId') groupId: string,
        @Body() body: any,
        @Req() req: any,
    ) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);
        return this.scimService.patchGroup(groupId, body);
    }

    @Delete('Groups/:groupId')
    @HttpCode(204)
    @Header('Content-Type', 'application/scim+json; charset=utf-8')
    async deleteGroup(@Param('groupId') groupId: string, @Req() req: any) {
        const token = req.headers.authorization?.split(' ')[1];
        await this.scimService.validateToken(token);
        await this.scimService.deleteGroup(groupId);
    }
}
