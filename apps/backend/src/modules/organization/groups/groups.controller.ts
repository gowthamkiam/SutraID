import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard, RequirePermission } from '../../rbac/rbac.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMembersDto } from './dto/add-members.dto';

@Controller('organizations/:orgId/groups')
@UseGuards(JwtAuthGuard, RbacGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) { }

  @Get()
  @RequirePermission('groups:read')
  async list(
    @Param('orgId') orgId: string,
    @Request() req: any,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.groupsService.list(
      orgId,
      {
        search,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      },
      req.user.id,
    );
  }

  @Post()
  @RequirePermission('groups:create')
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateGroupDto,
    @Request() req: any,
  ) {
    return this.groupsService.create(orgId, dto, req.user.id);
  }

  @Get(':groupId')
  @RequirePermission('groups:read')
  async get(
    @Param('orgId') orgId: string,
    @Param('groupId') groupId: string,
    @Request() req: any,
  ) {
    return this.groupsService.get(orgId, groupId, req.user.id);
  }

  @Put(':groupId')
  @RequirePermission('groups:update')
  async update(
    @Param('orgId') orgId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
    @Request() req: any,
  ) {
    return this.groupsService.update(orgId, groupId, dto, req.user.id);
  }

  @Delete(':groupId')
  @RequirePermission('groups:delete')
  async remove(
    @Param('orgId') orgId: string,
    @Param('groupId') groupId: string,
    @Request() req: any,
  ) {
    return this.groupsService.remove(orgId, groupId, req.user.id);
  }

  @Post(':groupId/members')
  @RequirePermission('groups:update')
  async addMembers(
    @Param('orgId') orgId: string,
    @Param('groupId') groupId: string,
    @Body() dto: AddMembersDto,
    @Request() req: any,
  ) {
    return this.groupsService.addMembers(orgId, groupId, dto.userIds, req.user.id);
  }

  @Delete(':groupId/members/:userId')
  @RequirePermission('groups:update')
  async removeMember(
    @Param('orgId') orgId: string,
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.groupsService.removeMember(orgId, groupId, userId, req.user.id);
  }
}
