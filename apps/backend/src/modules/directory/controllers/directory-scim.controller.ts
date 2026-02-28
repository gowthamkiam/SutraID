import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RbacGuard, RequirePermission } from '../../rbac/rbac.guard';
import { SCIMService } from '../services/scim.service';

@Controller('directory/scim')
@UseGuards(JwtAuthGuard, RbacGuard)
export class DirectoryScimController {
  constructor(private readonly scimService: SCIMService) {}

  @Post('token')
  @RequirePermission('directory:update')
  async generateToken() {
    return this.scimService.generateToken();
  }
}
