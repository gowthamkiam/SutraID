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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../guards/org-context.guard';
import { RbacGuard, RequirePermission } from '../../rbac/rbac.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { AssignGroupsDto } from './dto/assign-groups.dto';
import { AssignApplicationsDto } from './dto/assign-applications.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, OrgContextGuard, RbacGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission('users:read')
  async list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list({
      search: query.search,
      role: query.role,
      status: query.status,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });
  }

  @Post()
  @RequirePermission('users:create')
  async create(@Request() req: any, @Body() dto: CreateUserDto) {
    return this.usersService.create(dto, req.user.id);
  }

  @Put(':id')
  @RequirePermission('users:update')
  async update(
    @Request() req: any,
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, dto, req.user.id);
  }

  @Delete(':id')
  @RequirePermission('users:delete')
  async remove(
    @Request() req: any,
    @Param('id', new ParseUUIDPipe()) userId: string,
  ) {
    return this.usersService.remove(userId, req.user.id);
  }

  @Put(':id/groups')
  @RequirePermission('groups:update')
  async assignGroups(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() dto: AssignGroupsDto,
  ) {
    return this.usersService.assignGroups(userId, dto.groupIds || []);
  }

  @Put(':id/applications')
  @RequirePermission('apps:update')
  async assignApplications(
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Body() dto: AssignApplicationsDto,
  ) {
    return this.usersService.assignApplications(userId, dto.applicationIds || []);
  }
}
