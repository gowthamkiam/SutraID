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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard, RequirePermission } from '../../rbac/rbac.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@Controller('organizations/:orgId/users')
@UseGuards(JwtAuthGuard, RbacGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @RequirePermission('users:read')
  async list(
    @Param('orgId') orgId: string,
    @Query() query: ListUsersQueryDto,
    @Request() req: any,
  ) {
    return this.usersService.list(
      orgId,
      {
        search: query.search,
        role: query.role,
        status: query.status,
        page: query.page ? parseInt(query.page) : undefined,
        limit: query.limit ? parseInt(query.limit) : undefined,
      },
      req.user.id,
    );
  }

  @Post()
  @RequirePermission('users:create')
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateUserDto,
    @Request() req: any,
  ) {
    return this.usersService.create(orgId, dto, req.user.id);
  }

  @Get(':userId')
  @RequirePermission('users:read')
  async get(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.usersService.get(orgId, userId, req.user.id);
  }

  @Put(':userId')
  @RequirePermission('users:update')
  async update(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
    @Request() req: any,
  ) {
    return this.usersService.update(orgId, userId, dto, req.user.id);
  }

  @Delete(':userId')
  @RequirePermission('users:delete')
  async remove(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.usersService.remove(orgId, userId, req.user.id);
  }

  @Post(':userId/groups')
  @RequirePermission('groups:update')
  async assignGroup(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Body('groupId') groupId: string,
    @Request() req: any,
  ) {
    return this.usersService.assignGroup(orgId, userId, groupId, req.user.id);
  }

  @Delete(':userId/groups/:groupId')
  @RequirePermission('groups:update')
  async removeGroup(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Param('groupId') groupId: string,
    @Request() req: any,
  ) {
    return this.usersService.removeGroup(orgId, userId, groupId, req.user.id);
  }
}
