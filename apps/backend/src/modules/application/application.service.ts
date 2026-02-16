import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationService } from '../organization/organization.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { OrgRole, ApplicationProtocol } from '@prisma/client';
import { ApplicationUtils } from './utils/application.utils';

@Injectable()
export class ApplicationService {
  constructor(
    private prisma: PrismaService,
    private organizationService: OrganizationService,
    private utils: ApplicationUtils,
  ) { }

  /**
   * Create a new application
   */
  async create(
    organizationId: string,
    actorId: string,
    dto: CreateApplicationDto,
  ) {
    // Check if user has permission
    await this.organizationService.checkPermission(organizationId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.APP_ADMIN,
    ]);

    // Check application limit
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { _count: { select: { applications: true } } },
    });

    if (!org) throw new NotFoundException('Organization not found');

    if (org._count.applications >= org.maxApplications) {
      throw new BadRequestException(
        `Organization has reached maximum application limit (${org.maxApplications})`,
      );
    }

    let clientId: string | undefined = undefined;
    let clientSecret: string | undefined = undefined;
    let clientSecretHash: string | undefined = undefined;
    let samlCert: string | undefined = undefined;
    let samlKey: string | undefined = undefined;

    if (dto.type === ApplicationProtocol.OIDC) {
      clientId = this.utils.generateClientId();
      if (!dto.isPublicClient && !dto.isAiAgent) {
        clientSecret = this.utils.generateClientSecret();
        clientSecretHash = this.utils.hashSecret(clientSecret);
      }
    } else if (dto.type === ApplicationProtocol.SAML) {
      const { privateKey, certificate } = this.utils.generateSamlCertificates();
      samlKey = privateKey;
      samlCert = certificate;
    }

    // Create application
    const application = await this.prisma.application.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        logoUrl: dto.logoUrl,
        type: dto.type,
        clientId,
        clientSecretHash,
        redirectUris: dto.redirectUris || [],
        grantTypes: dto.grantTypes || ['authorization_code', 'refresh_token'],
        responseTypes: dto.responseTypes || ['code'],
        scopes: dto.scopes || ['openid', 'profile', 'email'],
        tokenEndpointAuthMethod: dto.tokenEndpointAuthMethod || 'client_secret_post',
        isPublicClient: dto.isPublicClient ?? false,
        requireDpop: dto.requireDpop ?? false,
        jwks: dto.jwks as any,
        dpopNonceEnabled: dto.dpopNonceEnabled ?? true,
        isAiAgent: dto.isAiAgent ?? false,
        samlEntityId: dto.samlEntityId,
        samlCertificate: samlCert,
        samlPrivateKey: samlKey,
        samlSpEntityId: dto.samlSpEntityId,
        samlSpAcsUrl: dto.samlSpAcsUrl,
        samlNameIdFormat: dto.samlNameIdFormat,
        samlAttributeMapping: dto.samlAttributeMapping as any,
        createdBy: actorId,
        status: 'ACTIVE',
      },
    });

    return {
      ...application,
      clientSecret, // Return plaintext secret once
    };
  }

  /**
   * Get all applications for an organization
   */
  async findAll(organizationId: string, actorId: string) {
    await this.organizationService.checkPermission(organizationId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.APP_ADMIN,
      OrgRole.READ_ONLY_ADMIN,
    ]);

    return this.prisma.application.findMany({
      where: {
        organizationId,
        status: { not: 'ARCHIVED' },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single application details
   */
  async findOne(applicationId: string, actorId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');

    await this.organizationService.checkPermission(
      application.organizationId,
      actorId,
      [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN, OrgRole.APP_ADMIN, OrgRole.READ_ONLY_ADMIN],
    );

    return application;
  }

  /**
   * Update application settings
   */
  async update(
    applicationId: string,
    actorId: string,
    dto: Partial<CreateApplicationDto>,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');

    await this.organizationService.checkPermission(
      application.organizationId,
      actorId,
      [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN, OrgRole.APP_ADMIN],
    );

    return this.prisma.application.update({
      where: { id: applicationId },
      data: {
        name: dto.name,
        description: dto.description,
        logoUrl: dto.logoUrl,
        redirectUris: dto.redirectUris,
        grantTypes: dto.grantTypes,
        responseTypes: dto.responseTypes,
        scopes: dto.scopes,
        tokenEndpointAuthMethod: dto.tokenEndpointAuthMethod,
        isPublicClient: dto.isPublicClient,
        requireDpop: dto.requireDpop,
        jwks: dto.jwks,
        dpopNonceEnabled: dto.dpopNonceEnabled,
        samlEntityId: dto.samlEntityId,
        samlSpEntityId: dto.samlSpEntityId,
        samlSpAcsUrl: dto.samlSpAcsUrl,
        samlNameIdFormat: dto.samlNameIdFormat,
        samlAttributeMapping: dto.samlAttributeMapping,
      },
    });
  }

  /**
   * Rotate client secret
   */
  async rotateSecret(applicationId: string, actorId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');

    if (application.type !== ApplicationProtocol.OIDC) {
      throw new BadRequestException('Secret rotation is only for OIDC applications');
    }

    await this.organizationService.checkPermission(
      application.organizationId,
      actorId,
      [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN],
    );

    const clientSecret = this.utils.generateClientSecret();
    const clientSecretHash = this.utils.hashSecret(clientSecret);

    await this.prisma.application.update({
      where: { id: applicationId },
      data: { clientSecretHash },
    });

    return {
      clientId: application.clientId,
      clientSecret,
      message: 'Client secret rotated successfully.',
    };
  }

  /**
   * Delete application (archive)
   */
  async remove(applicationId: string, actorId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');

    await this.organizationService.checkPermission(
      application.organizationId,
      actorId,
      [OrgRole.SUPER_ADMIN, OrgRole.ORG_ADMIN],
    );

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status: 'ARCHIVED' },
    });
  }
}

