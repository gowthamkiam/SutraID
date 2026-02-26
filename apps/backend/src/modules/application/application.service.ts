import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationService } from '../organization/organization.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreateAiAgentDto } from './dto/create-ai-agent.dto';
import { OrgRole, ApplicationProtocol } from '@prisma/client';
import { ApplicationUtils } from './utils/application.utils';
import { OidcIdpService } from '../sso/services/oidc-idp.service';

@Injectable()
export class ApplicationService {
  constructor(
    private prisma: PrismaService,
    private organizationService: OrganizationService,
    private utils: ApplicationUtils,
    private oidcIdpService: OidcIdpService,
    private config: ConfigService,
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
        allowROPC: dto.allowROPC ?? false,
        allowClientCredentials: dto.allowClientCredentials ?? false,
        allowRefreshForROPC: dto.allowRefreshForROPC ?? false,
        pkceRequired: dto.pkceRequired ?? true,
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
   * Create an AI Agent application
   */
  async createAiAgent(
    organizationId: string,
    actorId: string,
    dto: CreateAiAgentDto,
  ) {
    await this.organizationService.checkPermission(organizationId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.APP_ADMIN,
    ]);

    const createDto: CreateApplicationDto = {
      name: dto.name,
      description: dto.description,
      type: ApplicationProtocol.OIDC,
      isAiAgent: true,
      allowClientCredentials: true,
      grantTypes: ['client_credentials'],
      scopes: dto.scopes || ['ai:tool:call', 'ai:memory:read'],
      tokenEndpointAuthMethod: dto.tokenEndpointAuthMethod || 'client_secret_post',
      requireDpop: dto.requireDpop ?? false,
      jwks: dto.jwks,
      redirectUris: [],
      pkceRequired: false,
      aiAgentMetadata: {
        agentVersion: dto.agentVersion,
        maxTokenLifetime: dto.maxTokenLifetime || 3600,
      },
    };

    const application = await this.create(organizationId, actorId, createDto);

    const baseUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();
    const apiPrefix = this.config.get<string>('API_PREFIX') || 'api/v1';

    return {
      agent_id: application.clientId,
      client_id: application.clientId,
      client_secret: application.clientSecret,
      scopes: createDto.scopes,
      token_endpoint: `${baseUrl}/${apiPrefix}/oauth/token`,
      introspection_endpoint: `${baseUrl}/${apiPrefix}/oauth/introspect`,
    };
  }

  /**
   * List all AI Agent applications
   */
  async listAiAgents(organizationId: string, actorId: string) {
    await this.organizationService.checkPermission(organizationId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.APP_ADMIN,
      OrgRole.READ_ONLY_ADMIN,
    ]);

    return this.prisma.application.findMany({
      where: {
        organizationId,
        isAiAgent: true,
        status: { not: 'ARCHIVED' },
      },
      select: {
        id: true,
        name: true,
        description: true,
        clientId: true,
        scopes: true,
        aiAgentMetadata: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });
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

    return (this.prisma as any).application.findMany({
      where: {
        organizationId,
        status: { not: 'ARCHIVED' },
      },
      include: {
        _count: {
          select: {
            userAssignments: true,
            groupAssignments: true,
          },
        },
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

    // Validate ROPC requires confidential client
    const effectiveIsPublic = dto.isPublicClient ?? application.isPublicClient;
    const effectiveAllowROPC = dto.allowROPC ?? application.allowROPC;
    if (effectiveAllowROPC && effectiveIsPublic) {
      throw new BadRequestException('ROPC requires a confidential client');
    }

    const updated = await this.prisma.application.update({
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
        allowROPC: dto.allowROPC,
        allowClientCredentials: dto.allowClientCredentials,
        allowRefreshForROPC: dto.allowRefreshForROPC,
        pkceRequired: dto.pkceRequired,
        samlEntityId: dto.samlEntityId,
        samlSpEntityId: dto.samlSpEntityId,
        samlSpAcsUrl: dto.samlSpAcsUrl,
        samlNameIdFormat: dto.samlNameIdFormat,
        samlAttributeMapping: dto.samlAttributeMapping,
      },
    });

    // Invalidate cached OIDC provider instance when grant settings change
    if (
      dto.allowROPC !== undefined ||
      dto.allowClientCredentials !== undefined ||
      dto.allowRefreshForROPC !== undefined ||
      dto.pkceRequired !== undefined
    ) {
      this.oidcIdpService.clearProviderCache(applicationId);
    }

    return updated;
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

    // Clean up orphaned OIDC tokens
    await (this.prisma as any).oidcToken?.deleteMany({
      where: { applicationId },
    });

    return this.prisma.application.delete({
      where: { id: applicationId },
    });
  }

  async setAssignedUsers(
    organizationId: string,
    applicationId: string,
    actorId: string,
    userIds: string[],
  ) {
    await this.organizationService.checkPermission(organizationId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.APP_ADMIN,
      OrgRole.USER_ADMIN,
    ]);

    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, organizationId, status: { not: 'ARCHIVED' } },
      select: { id: true },
    });
    if (!application) throw new NotFoundException('Application not found');

    const uniqueUserIds = Array.from(new Set(userIds));
    const validMembers = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        userId: { in: uniqueUserIds },
        status: 'ACTIVE',
      },
      select: { userId: true },
    });
    const validUserIds = validMembers.map((m) => m.userId);

    const prismaAny = this.prisma as any;

    await prismaAny.userApplicationAssignment.deleteMany({
      where: {
        applicationId,
        user: { organizationId },
      },
    });

    if (validUserIds.length > 0) {
      await prismaAny.userApplicationAssignment.createMany({
        data: validUserIds.map((userId) => ({ applicationId, userId })),
        skipDuplicates: true,
      });
    }

    return { success: true, userIds: validUserIds };
  }

  async setAssignedGroups(
    organizationId: string,
    applicationId: string,
    actorId: string,
    groupIds: string[],
  ) {
    await this.organizationService.checkPermission(organizationId, actorId, [
      OrgRole.SUPER_ADMIN,
      OrgRole.ORG_ADMIN,
      OrgRole.APP_ADMIN,
      OrgRole.GROUP_MEMBERSHIP_ADMIN,
    ]);

    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, organizationId, status: { not: 'ARCHIVED' } },
      select: { id: true },
    });
    if (!application) throw new NotFoundException('Application not found');

    const uniqueGroupIds = Array.from(new Set(groupIds));
    const validGroups = await this.prisma.group.findMany({
      where: { id: { in: uniqueGroupIds }, organizationId },
      select: { id: true },
    });
    const validGroupIds = validGroups.map((group) => group.id);

    const prismaAny = this.prisma as any;

    await prismaAny.groupApplicationAssignment.deleteMany({
      where: {
        applicationId,
        group: { organizationId },
      },
    });

    if (validGroupIds.length > 0) {
      await prismaAny.groupApplicationAssignment.createMany({
        data: validGroupIds.map((groupId) => ({ applicationId, groupId })),
        skipDuplicates: true,
      });
    }

    return { success: true, groupIds: validGroupIds };
  }
}
