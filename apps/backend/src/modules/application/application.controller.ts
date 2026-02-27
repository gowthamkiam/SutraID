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
import { CreateAiAgentDto } from './dto/create-ai-agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../organization/guards/org-context.guard';
import { RbacGuard, RequirePermission } from '../rbac/rbac.guard';
import { AssignUsersDto } from './dto/assign-users.dto';
import { AssignGroupsDto } from './dto/assign-groups.dto';

@Controller('applications')
@UseGuards(JwtAuthGuard, OrgContextGuard, RbacGuard)
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
  ) { }

  @Post()
  @RequirePermission('apps:create')
  async create(
    @Request() req: any,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationService.create(req.user.id, dto);
  }

  @Get()
  @RequirePermission('apps:read')
  async findAll(@Request() req: any) {
    return this.applicationService.findAll(req.user.id);
  }

  @Get(':appId')
  @RequirePermission('apps:read')
  async findOne(@Request() req: any, @Param('appId') appId: string) {
    return this.applicationService.findOne(appId, req.user.id);
  }

  @Put(':appId')
  @RequirePermission('apps:update')
  async update(
    @Request() req: any,
    @Param('appId') appId: string,
    @Body() dto: Partial<CreateApplicationDto>,
  ) {
    return this.applicationService.update(appId, req.user.id, dto);
  }

  @Post(':appId/rotate-secret')
  @RequirePermission('apps:update')
  async rotateSecret(@Request() req: any, @Param('appId') appId: string) {
    return this.applicationService.rotateSecret(appId, req.user.id);
  }

  @Get(':appId/signing-keys')
  @RequirePermission('apps:read')
  async listSigningKeys(@Request() req: any, @Param('appId') appId: string) {
    return this.applicationService.listSigningKeys(appId, req.user.id);
  }

  @Post(':appId/rotate-signing-key')
  @RequirePermission('apps:update')
  async rotateSigningKey(@Request() req: any, @Param('appId') appId: string) {
    return this.applicationService.rotateSigningKey(appId, req.user.id);
  }

  @Post('ai-agents')
  @RequirePermission('apps:create')
  async createAiAgent(
    @Request() req: any,
    @Body() dto: CreateAiAgentDto,
  ) {
    return this.applicationService.createAiAgent(req.user.id, dto);
  }

  @Get('ai-agents')
  @RequirePermission('apps:read')
  async listAiAgents(@Request() req: any) {
    return this.applicationService.listAiAgents(req.user.id);
  }

  @Delete(':appId')
  @RequirePermission('apps:delete')
  async remove(@Request() req: any, @Param('appId') appId: string) {
    return this.applicationService.remove(appId, req.user.id);
  }

  @Put(':appId/users')
  @RequirePermission('apps:update')
  async assignUsers(
    @Request() req: any,
    @Param('appId', new ParseUUIDPipe()) appId: string,
    @Body() dto: AssignUsersDto,
  ) {
    return this.applicationService.setAssignedUsers(appId, req.user.id, dto.userIds || []);
  }

  @Put(':appId/groups')
  @RequirePermission('apps:update')
  async assignGroups(
    @Request() req: any,
    @Param('appId', new ParseUUIDPipe()) appId: string,
    @Body() dto: AssignGroupsDto,
  ) {
    return this.applicationService.setAssignedGroups(appId, req.user.id, dto.groupIds || []);
  }
}
