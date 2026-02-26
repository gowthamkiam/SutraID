import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  CustomizeLoginDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from './guards/org-context.guard';
import { RbacGuard, RequirePermission } from '../rbac/rbac.guard';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateOrganizationDto) {
    return this.organizationService.create(req.user.id, dto);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.organizationService.findUserOrganizations(req.user.id);
  }

  @Get(':orgId')
  async findOne(@Request() req: any, @Param('orgId') orgId: string) {
    return this.organizationService.findOne(orgId, req.user.id);
  }

  @Put(':orgId')
  @UseGuards(OrgContextGuard, RbacGuard)
  @RequirePermission('org:update')
  async update(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(orgId, req.user.id, dto);
  }

  @Delete(':orgId')
  @UseGuards(OrgContextGuard, RbacGuard)
  @RequirePermission('org:delete')
  async remove(@Request() req: any, @Param('orgId') orgId: string) {
    return this.organizationService.remove(orgId, req.user.id);
  }

  @Post(':orgId/members/invite')
  @UseGuards(OrgContextGuard, RbacGuard)
  @RequirePermission('org:update')
  async inviteMember(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.organizationService.inviteMember(orgId, req.user.id, dto);
  }

  @Put(':orgId/members/:memberId/role')
  @UseGuards(OrgContextGuard, RbacGuard)
  @RequirePermission('org:update')
  async updateMemberRole(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.organizationService.updateMemberRole(
      orgId,
      memberId,
      req.user.id,
      dto,
    );
  }

  @Delete(':orgId/members/:memberId')
  @UseGuards(OrgContextGuard, RbacGuard)
  @RequirePermission('org:update')
  async removeMember(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.organizationService.removeMember(orgId, memberId, req.user.id);
  }

  @Patch(':orgId/customize-login')
  @UseGuards(OrgContextGuard, RbacGuard)
  @RequirePermission('org:update')
  async customizeLogin(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Body() dto: CustomizeLoginDto,
  ) {
    return this.organizationService.customizeLogin(orgId, req.user.id, dto);
  }
}
