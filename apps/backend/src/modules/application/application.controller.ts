import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Res,
  UseGuards,
  Request,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SamlIdpService } from '../sso/services/saml-idp.service';
import { OidcIdpService } from '../sso/services/oidc-idp.service';

@Controller('organizations/:orgId/applications')
@UseGuards(JwtAuthGuard)
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly samlIdpService: SamlIdpService,
    private readonly oidcIdpService: OidcIdpService,
  ) {}

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

  /**
   * GET :appId/idp-metadata
   * Returns SAML metadata XML or OIDC discovery JSON depending on what's enabled
   */
  @Get(':appId/idp-metadata')
  @HttpCode(HttpStatus.OK)
  async getIdpMetadata(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Param('appId') appId: string,
    @Res() res: Response,
  ) {
    const app = await this.applicationService.findOne(appId, req.user.id);

    if (app.samlIdpEnabled) {
      const metadata = await this.samlIdpService.getIdpMetadata(orgId);
      res.set('Content-Type', 'application/samlmetadata+xml');
      return res.send(metadata);
    }

    if (app.oidcIdpEnabled) {
      const discovery = await this.oidcIdpService.getDiscoveryMetadata(orgId);
      return res.json(discovery);
    }

    throw new BadRequestException(
      'No IdP mode is enabled for this application',
    );
  }
}
