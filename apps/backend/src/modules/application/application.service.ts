import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreateAiAgentDto } from './dto/create-ai-agent.dto';
import { ApplicationProtocol } from '@prisma/client';
import { ApplicationUtils } from './utils/application.utils';
import { OidcIdpService } from '../sso/services/oidc-idp.service';

@Injectable()
export class ApplicationService {
  constructor(
    private prisma: PrismaService,
    private utils: ApplicationUtils,
    private oidcIdpService: OidcIdpService,
    private config: ConfigService,
  ) { }

  async create(
    actorId: string,
    dto: CreateApplicationDto,
  ) {
    let clientId: string | undefined = undefined;
    let clientSecret: string | undefined = undefined;
    let clientSecretHash: string | undefined = undefined;
    let samlCert: string | undefined = undefined;
    let samlKey: string | undefined = undefined;

    if (dto.type === ApplicationProtocol.OIDC) {
      clientId = this.utils.generateClientId();
      if (!dto.isPublicClient) {
        clientSecret = this.utils.generateClientSecret();
        clientSecretHash = this.utils.hashSecret(clientSecret);
      }
    } else if (dto.type === ApplicationProtocol.SAML) {
      const { privateKey, certificate } = this.utils.generateSamlCertificates();
      samlKey = privateKey;
      samlCert = certificate;
    }

    const application = await this.prisma.application.create({
      data: {
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

    if (dto.type === ApplicationProtocol.OIDC) {
      const keyPair = await this.utils.generateSigningKeyPair();
      await this.prisma.oidcSigningKey.create({
        data: {
          applicationId: application.id,
          kid: keyPair.kid,
          algorithm: keyPair.algorithm as any,
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey,
          isDefault: true,
        },
      });
    }

    return {
      ...application,
      clientSecret,
    };
  }

  async createAiAgent(
    actorId: string,
    dto: CreateAiAgentDto,
  ) {
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

    const application = await this.create(actorId, createDto);

    const baseUrl = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').split(',')[0].trim();

    return {
      agent_id: application.clientId,
      client_id: application.clientId,
      client_secret: application.clientSecret,
      scopes: createDto.scopes,
      token_endpoint: `${baseUrl}/oauth/token`,
      introspection_endpoint: `${baseUrl}/oauth/introspect`,
    };
  }

  async listAiAgents(actorId: string) {
    return this.prisma.application.findMany({
      where: {
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

  async findAll(actorId: string) {
    return (this.prisma as any).application.findMany({
      where: {
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

  async findOne(applicationId: string, actorId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');

    return application;
  }

  async update(
    applicationId: string,
    actorId: string,
    dto: Partial<CreateApplicationDto>,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');

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

  async rotateSecret(applicationId: string, actorId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');

    if (application.type !== ApplicationProtocol.OIDC) {
      throw new BadRequestException('Secret rotation is only for OIDC applications');
    }

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

  async listSigningKeys(applicationId: string, actorId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!application) throw new NotFoundException('Application not found');

    return this.prisma.oidcSigningKey.findMany({
      where: { applicationId },
      select: {
        id: true,
        kid: true,
        algorithm: true,
        isDefault: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async rotateSigningKey(applicationId: string, actorId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.type !== ApplicationProtocol.OIDC) {
      throw new BadRequestException('Signing key rotation is only for OIDC applications');
    }

    await this.prisma.oidcSigningKey.updateMany({
      where: { applicationId, isDefault: true },
      data: { isDefault: false },
    });

    const keyPair = await this.utils.generateSigningKeyPair();
    const newKey = await this.prisma.oidcSigningKey.create({
      data: {
        applicationId,
        kid: keyPair.kid,
        algorithm: keyPair.algorithm as any,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        isDefault: true,
      },
      select: { id: true, kid: true, algorithm: true, isDefault: true, createdAt: true },
    });

    this.oidcIdpService.clearProviderCache(applicationId);

    return {
      ...newKey,
      message: 'Signing key rotated successfully.',
    };
  }

  async remove(applicationId: string, actorId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');

    await (this.prisma as any).oidcToken?.deleteMany({
      where: { applicationId },
    });

    return this.prisma.application.delete({
      where: { id: applicationId },
    });
  }

  async setAssignedUsers(
    applicationId: string,
    actorId: string,
    userIds: string[],
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, status: { not: 'ARCHIVED' } },
      select: { id: true },
    });
    if (!application) throw new NotFoundException('Application not found');

    const uniqueUserIds = Array.from(new Set(userIds));
    const validUsers = await this.prisma.user.findMany({
      where: {
        id: { in: uniqueUserIds },
      },
      select: { id: true },
    });
    const validUserIds = validUsers.map((u) => u.id);

    const prismaAny = this.prisma as any;

    await prismaAny.userApplicationAssignment.deleteMany({
      where: { applicationId },
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
    applicationId: string,
    actorId: string,
    groupIds: string[],
  ) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, status: { not: 'ARCHIVED' } },
      select: { id: true },
    });
    if (!application) throw new NotFoundException('Application not found');

    const uniqueGroupIds = Array.from(new Set(groupIds));
    const validGroups = await this.prisma.group.findMany({
      where: { id: { in: uniqueGroupIds } },
      select: { id: true },
    });
    const validGroupIds = validGroups.map((group) => group.id);

    const prismaAny = this.prisma as any;

    await prismaAny.groupApplicationAssignment.deleteMany({
      where: { applicationId },
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
