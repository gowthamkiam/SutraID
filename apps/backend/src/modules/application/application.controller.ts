import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignUsersDto } from './dto/assign-users.dto';
import { AssignGroupsDto } from './dto/assign-groups.dto';

@Controller('organizations/:orgId/applications')
@UseGuards(JwtAuthGuard)
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
  ) { }

  @Post()
  async create(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationService.create(orgId, req.user.id, dto);
  }

  @Get()
  async findAll(@Request() req: any, @Param('orgId') orgId: string) {
    return this.applicationService.findAll(orgId, req.user.id);
  }

  @Get(':appId')
  async findOne(@Request() req: any, @Param('appId') appId: string) {
    return this.applicationService.findOne(appId, req.user.id);
  }

  @Put(':appId')
  async update(
    @Request() req: any,
    @Param('appId') appId: string,
    @Body() dto: Partial<CreateApplicationDto>,
  ) {
    return this.applicationService.update(appId, req.user.id, dto);
  }

  @Post(':appId/rotate-secret')
  async rotateSecret(@Request() req: any, @Param('appId') appId: string) {
    return this.applicationService.rotateSecret(appId, req.user.id);
  }

  @Delete(':appId')
  async remove(@Request() req: any, @Param('appId') appId: string) {
    return this.applicationService.remove(appId, req.user.id);
  }

  @Put(':appId/users')
  async assignUsers(
    @Request() req: any,
    @Param('orgId', new ParseUUIDPipe()) orgId: string,
    @Param('appId', new ParseUUIDPipe()) appId: string,
    @Body() dto: AssignUsersDto,
  ) {
    return this.applicationService.setAssignedUsers(orgId, appId, req.user.id, dto.userIds || []);
  }

  @Put(':appId/groups')
  async assignGroups(
    @Request() req: any,
    @Param('orgId', new ParseUUIDPipe()) orgId: string,
    @Param('appId', new ParseUUIDPipe()) appId: string,
    @Body() dto: AssignGroupsDto,
  ) {
    return this.applicationService.setAssignedGroups(orgId, appId, req.user.id, dto.groupIds || []);
  }
}
