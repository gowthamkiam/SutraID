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
import { SsoService } from './sso.service';
import { CreateSsoProviderDto } from './dto/create-sso-provider.dto';
import { UpdateSsoProviderDto } from './dto/update-sso-provider.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgContextGuard } from '../organization/guards/org-context.guard';
import { RbacGuard, RequirePermission } from '../rbac/rbac.guard';

@Controller('sso/providers')
@UseGuards(JwtAuthGuard, OrgContextGuard, RbacGuard)
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Post()
  @RequirePermission('sso:create')
  async create(
    @Request() req: any,
    @Body() dto: CreateSsoProviderDto,
  ) {
    return this.ssoService.create(req.user.id, dto);
  }

  @Get()
  @RequirePermission('sso:read')
  async findAll(@Request() req: any) {
    return this.ssoService.findAll(req.user.id);
  }

  @Get(':providerId')
  @RequirePermission('sso:read')
  async findOne(@Request() req: any, @Param('providerId') providerId: string) {
    return this.ssoService.findOne(providerId, req.user.id);
  }

  @Put(':providerId')
  @RequirePermission('sso:update')
  async update(
    @Request() req: any,
    @Param('providerId') providerId: string,
    @Body() dto: UpdateSsoProviderDto,
  ) {
    return this.ssoService.update(providerId, req.user.id, dto);
  }

  @Delete(':providerId')
  @RequirePermission('sso:delete')
  async remove(@Request() req: any, @Param('providerId') providerId: string) {
    return this.ssoService.remove(providerId, req.user.id);
  }

  @Post(':providerId/test')
  @RequirePermission('sso:read')
  async testConnection(
    @Request() req: any,
    @Param('providerId') providerId: string,
  ) {
    return this.ssoService.testConnection(providerId, req.user.id);
  }
}
