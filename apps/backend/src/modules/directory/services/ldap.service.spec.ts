import { Test, TestingModule } from '@nestjs/testing';
import { LDAPService } from './ldap.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationService } from '../../organization/organization.service';
import { OrgRole } from '@prisma/client';

describe('LDAPService', () => {
    let service: LDAPService;
    let prisma: jest.Mocked<PrismaService>;
    let organizationService: jest.Mocked<OrganizationService>;

    const mockPrisma = {
        directoryConfig: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockOrganizationService = {
        checkPermission: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LDAPService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
                {
                    provide: OrganizationService,
                    useValue: mockOrganizationService,
                },
            ],
        }).compile();

        service = module.get<LDAPService>(LDAPService);
        prisma = module.get(PrismaService);
        organizationService = module.get(OrganizationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('updateConfig', () => {
        it('should update LDAP config if user has permission', async () => {
            const orgId = 'org-1';
            const actorId = 'actor-1';
            const data = { ldapUrl: 'ldap://localhost' };

            mockOrganizationService.checkPermission.mockResolvedValue({} as any);
            mockPrisma.directoryConfig.upsert.mockResolvedValue({} as any);

            await service.updateConfig(orgId, actorId, data);

            expect(mockOrganizationService.checkPermission).toHaveBeenCalledWith(orgId, actorId, [
                OrgRole.SUPER_ADMIN,
                OrgRole.ORG_ADMIN,
            ]);
            expect(mockPrisma.directoryConfig.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { organizationId: orgId },
                    create: expect.objectContaining({ type: 'LDAP' }),
                }),
            );
        });
    });

    describe('syncOrganization', () => {
        it('should trigger sync if config is valid and user has permission', async () => {
            const orgId = 'org-1';
            const actorId = 'actor-1';
            const mockConfig = { id: 'config-1', type: 'LDAP', enabled: true };

            mockOrganizationService.checkPermission.mockResolvedValue({} as any);
            mockPrisma.directoryConfig.findUnique.mockResolvedValue(mockConfig as any);
            mockPrisma.directoryConfig.update.mockResolvedValue({} as any);

            await service.syncOrganization(orgId, actorId);

            expect(mockOrganizationService.checkPermission).toHaveBeenCalledWith(orgId, actorId, [
                OrgRole.SUPER_ADMIN,
                OrgRole.ORG_ADMIN,
            ]);
            expect(mockPrisma.directoryConfig.update).toHaveBeenCalled();
        });

        it('should not sync if config is missing', async () => {
            const orgId = 'org-1';
            const actorId = 'actor-1';

            mockOrganizationService.checkPermission.mockResolvedValue({} as any);
            mockPrisma.directoryConfig.findUnique.mockResolvedValue(null);

            await service.syncOrganization(orgId, actorId);

            expect(mockPrisma.directoryConfig.update).not.toHaveBeenCalled();
        });
    });
});
