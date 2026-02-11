import {
  Controller,
  Get,
  Post,
  Put,
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
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  async update(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(orgId, req.user.id, dto);
  }

  @Delete(':orgId')
  async remove(@Request() req: any, @Param('orgId') orgId: string) {
    return this.organizationService.remove(orgId, req.user.id);
  }

  @Post(':orgId/members/invite')
  async inviteMember(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.organizationService.inviteMember(orgId, req.user.id, dto);
  }

  @Put(':orgId/members/:memberId/role')
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
  async removeMember(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.organizationService.removeMember(orgId, memberId, req.user.id);
  }
}
