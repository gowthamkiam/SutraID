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

@Controller('organizations/:orgId/sso/providers')
@UseGuards(JwtAuthGuard)
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  @Post()
  async create(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Body() dto: CreateSsoProviderDto,
  ) {
    return this.ssoService.create(orgId, req.user.id, dto);
  }

  @Get()
  async findAll(@Request() req: any, @Param('orgId') orgId: string) {
    return this.ssoService.findAll(orgId, req.user.id);
  }

  @Get(':providerId')
  async findOne(@Request() req: any, @Param('providerId') providerId: string) {
    return this.ssoService.findOne(providerId, req.user.id);
  }

  @Put(':providerId')
  async update(
    @Request() req: any,
    @Param('providerId') providerId: string,
    @Body() dto: UpdateSsoProviderDto,
  ) {
    return this.ssoService.update(providerId, req.user.id, dto);
  }

  @Delete(':providerId')
  async remove(@Request() req: any, @Param('providerId') providerId: string) {
    return this.ssoService.remove(providerId, req.user.id);
  }

  @Post(':providerId/test')
  async testConnection(
    @Request() req: any,
    @Param('providerId') providerId: string,
  ) {
    return this.ssoService.testConnection(providerId, req.user.id);
  }
}
