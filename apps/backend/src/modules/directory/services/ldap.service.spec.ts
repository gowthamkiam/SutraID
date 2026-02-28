import { Test, TestingModule } from '@nestjs/testing';
import { LDAPService } from './ldap.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('LDAPService', () => {
    let service: LDAPService;
    let prisma: jest.Mocked<PrismaService>;

    const mockPrisma = {
        directoryConfig: {
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LDAPService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
            ],
        }).compile();

        service = module.get<LDAPService>(LDAPService);
        prisma = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('updateConfig', () => {
        it('should update LDAP config', async () => {
            const data = { ldapUrl: 'ldap://localhost' };
            mockPrisma.directoryConfig.findFirst.mockResolvedValue({ id: 'config-1' } as any);
            mockPrisma.directoryConfig.update.mockResolvedValue({} as any);

            await service.updateConfig(data);

            expect(mockPrisma.directoryConfig.update).toHaveBeenCalled();
        });

        it('should create LDAP config if not exists', async () => {
            const data = { ldapUrl: 'ldap://localhost' };
            mockPrisma.directoryConfig.findFirst.mockResolvedValue(null);
            mockPrisma.directoryConfig.create.mockResolvedValue({} as any);

            await service.updateConfig(data);

            expect(mockPrisma.directoryConfig.create).toHaveBeenCalled();
        });
    });

    describe('sync', () => {
        it('should trigger sync if config is valid', async () => {
            const mockConfig = { id: 'config-1', type: 'LDAP', enabled: true };
            mockPrisma.directoryConfig.findFirst.mockResolvedValue(mockConfig as any);
            mockPrisma.directoryConfig.update.mockResolvedValue({} as any);

            await service.sync();

            expect(mockPrisma.directoryConfig.update).toHaveBeenCalled();
        });

        it('should not sync if config is missing', async () => {
            mockPrisma.directoryConfig.findFirst.mockResolvedValue(null);

            await service.sync();

            expect(mockPrisma.directoryConfig.update).not.toHaveBeenCalled();
        });
    });
});
