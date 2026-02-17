import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../guards/org-context.guard';
import { RbacGuard, RequirePermission } from '../../rbac/rbac.guard';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMembersDto } from './dto/add-members.dto';
import { AssignApplicationsDto } from './dto/assign-applications.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard, OrgContextGuard, RbacGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @RequirePermission('groups:read')
  async list(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.groupsService.list(req.orgId, {
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  @RequirePermission('groups:create')
  async create(@Request() req: any, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(req.orgId, dto);
  }

  @Put(':id')
  @RequirePermission('groups:update')
  async update(
    @Request() req: any,
    @Param('id', new ParseUUIDPipe()) groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(req.orgId, groupId, dto);
  }

  @Delete(':id')
  @RequirePermission('groups:delete')
  async remove(
    @Request() req: any,
    @Param('id', new ParseUUIDPipe()) groupId: string,
  ) {
    return this.groupsService.remove(req.orgId, groupId);
  }

  @Put(':id/users')
  @RequirePermission('groups:update')
  async setUsers(
    @Request() req: any,
    @Param('id', new ParseUUIDPipe()) groupId: string,
    @Body() dto: AddMembersDto,
  ) {
    return this.groupsService.setUsers(req.orgId, groupId, dto.userIds || []);
  }

  @Put(':id/applications')
  @RequirePermission('apps:update')
  async setApplications(
    @Request() req: any,
    @Param('id', new ParseUUIDPipe()) groupId: string,
    @Body() dto: AssignApplicationsDto,
  ) {
    return this.groupsService.setApplications(req.orgId, groupId, dto.applicationIds || []);
  }
}
