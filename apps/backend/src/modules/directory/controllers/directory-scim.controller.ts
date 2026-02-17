import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OrganizationService } from '../../organization/organization.service';
import { SCIMService } from '../services/scim.service';

@Controller('directory/scim/:orgId')
@UseGuards(JwtAuthGuard)
export class DirectoryScimController {
  constructor(
    private readonly scimService: SCIMService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Post('token')
  async generateToken(@Param('orgId') orgId: string, @Req() req: any) {
    await this.organizationService.checkPermission(orgId, req.user.id, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.API_ACCESS_MANAGEMENT_ADMIN,
    ]);

    return this.scimService.generateToken(orgId);
  }
}
