import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationService } from '../organization/organization.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { OrgRole } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ApplicationService {
  constructor(
    private prisma: PrismaService,
    private organizationService: OrganizationService,
  ) {}

  /**
   * Generate secure OAuth credentials
   */
  private generateClientCredentials() {
    const clientId = `app_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecret = `sk_${crypto.randomBytes(32).toString('hex')}`;

    // Hash client secret for storage (we'll return plaintext once, then store hash)
    const clientSecretHash = crypto
      .createHash('sha256')
      .update(clientSecret)
      .digest('hex');

    return { clientId, clientSecret, clientSecretHash };
  }

  /**
   * Create a new application (requires OWNER, ADMIN, or DEVELOPER role)
   */
  async create(
    organizationId: string,
    userId: string,
    dto: CreateApplicationDto,
  ) {
    // Check if user has permission (OWNER, ADMIN, or DEVELOPER)
    await this.organizationService.checkPermission(organizationId, userId, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
      OrgRole.DEVELOPER,
    ]);

    // Get organization to check limits
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Check application limit
    if (org._count.applications >= org.maxApplications) {
      throw new BadRequestException(
        `Organization has reached maximum application limit (${org.maxApplications})`,
      );
    }

    // Generate OAuth credentials
    const { clientId, clientSecret, clientSecretHash } =
      this.generateClientCredentials();

    // Create application
    const application = await this.prisma.application.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        logoUrl: dto.logoUrl,
        clientId,
        clientSecret: clientSecretHash, // Store hashed secret
        redirectUris: dto.redirectUris,
        allowedOrigins: dto.allowedOrigins || [],
        type: dto.type,
        status: 'ACTIVE',
      },
    });

    // Return application with plaintext secret (only shown once!)
    return {
      ...application,
      clientSecret, // Plaintext secret (will not be retrievable again)
    };
  }

  /**
   * Get all applications for an organization
   */
  async findAll(organizationId: string, userId: string) {
    // Check if user has access to organization
    await this.organizationService.checkPermission(organizationId, userId, [
      OrgRole.OWNER,
      OrgRole.ADMIN,
      OrgRole.DEVELOPER,
      OrgRole.MEMBER,
    ]);

    return this.prisma.application.findMany({
      where: {
        organizationId,
        status: { not: 'ARCHIVED' },
      },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        clientId: true,
        // Do NOT return clientSecret
        redirectUris: true,
        allowedOrigins: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get single application details
   */
  async findOne(applicationId: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        organizationId: true,
        name: true,
        description: true,
        logoUrl: true,
        clientId: true,
        // Do NOT return clientSecret
        redirectUris: true,
        allowedOrigins: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check if user has access
    await this.organizationService.checkPermission(
      application.organizationId,
      userId,
      [OrgRole.OWNER, OrgRole.ADMIN, OrgRole.DEVELOPER, OrgRole.MEMBER],
    );

    return application;
  }

  /**
   * Update application settings
   */
  async update(
    applicationId: string,
    userId: string,
    dto: Partial<CreateApplicationDto>,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check if user has permission (OWNER, ADMIN, or DEVELOPER)
    await this.organizationService.checkPermission(
      application.organizationId,
      userId,
      [OrgRole.OWNER, OrgRole.ADMIN, OrgRole.DEVELOPER],
    );

    return this.prisma.application.update({
      where: { id: applicationId },
      data: {
        name: dto.name,
        description: dto.description,
        logoUrl: dto.logoUrl,
        redirectUris: dto.redirectUris,
        allowedOrigins: dto.allowedOrigins,
        type: dto.type,
      },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        clientId: true,
        redirectUris: true,
        allowedOrigins: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Rotate client secret (requires OWNER or ADMIN)
   */
  async rotateSecret(applicationId: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Only OWNER or ADMIN can rotate secrets
    await this.organizationService.checkPermission(
      application.organizationId,
      userId,
      [OrgRole.OWNER, OrgRole.ADMIN],
    );

    // Generate new credentials
    const { clientSecret, clientSecretHash } =
      this.generateClientCredentials();

    // Update application with new secret
    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        clientSecret: clientSecretHash,
      },
    });

    // Return new plaintext secret (only shown once!)
    return {
      clientId: application.clientId,
      clientSecret, // New plaintext secret
      message: 'Client secret rotated successfully. Save this secret now.',
    };
  }

  /**
   * Delete application (archive)
   */
  async remove(applicationId: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Only OWNER or ADMIN can delete
    await this.organizationService.checkPermission(
      application.organizationId,
      userId,
      [OrgRole.OWNER, OrgRole.ADMIN],
    );

    // Soft delete by setting status to ARCHIVED
    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status: 'ARCHIVED' },
    });
  }
}
