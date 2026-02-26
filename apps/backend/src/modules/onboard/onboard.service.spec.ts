import { Test, TestingModule } from '@nestjs/testing';
import { OnboardService } from './onboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/services/auth.service';
import { ApplicationService } from '../application/application.service';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';

describe('OnboardService', () => {
    let service: OnboardService;
    let prisma: PrismaService;
    let authService: AuthService;
    let appService: ApplicationService;

    const mockPrisma = {
        organization: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    } as any;

    const mockAuthService = {
        requestMagicLink: jest.fn().mockResolvedValue(undefined),
    } as any;

    const mockAppService = {
        create: jest.fn().mockResolvedValue({ id: 'app-id' }),
    } as any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OnboardService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuthService, useValue: mockAuthService },
                { provide: ApplicationService, useValue: mockAppService },
            ],
        }).compile();

        service = module.get<OnboardService>(OnboardService);
        prisma = module.get<PrismaService>(PrismaService);
        authService = module.get<AuthService>(AuthService);
        appService = module.get<ApplicationService>(ApplicationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const baseDto = {
        organization: { name: 'Acme Inc', slug: 'acme-inc', primaryColor: '#ff0000' },
        application: { name: 'MyApp', type: 'WEB' as any, redirectUris: ['https://example.com/callback'] },
        adminEmail: 'admin@example.com',
    };

    it('should successfully onboard with application', async () => {
        mockPrisma.organization.findUnique
            .mockResolvedValueOnce(null) // slug check
            .mockResolvedValueOnce(null); // name check
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({ id: 'user-id', email: baseDto.adminEmail } as any);
        mockPrisma.organization.create.mockResolvedValue({ id: 'org-id' } as any);
        mockPrisma.user.update.mockResolvedValue({} as any);

        await expect(service.onboard(baseDto)).resolves.not.toThrow();
        expect(mockPrisma.organization.create).toHaveBeenCalled();
        expect(mockAppService.create).toHaveBeenCalledWith('org-id', 'user-id', expect.any(Object));
        expect(mockAuthService.requestMagicLink).toHaveBeenCalledWith(baseDto.adminEmail);
    });

    it('should successfully onboard without application when skipped', async () => {
        const dto = { ...baseDto, application: undefined };
        mockPrisma.organization.findUnique
            .mockResolvedValueOnce(null) // slug check
            .mockResolvedValueOnce(null); // name check
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({ id: 'user-id', email: dto.adminEmail } as any);
        mockPrisma.organization.create.mockResolvedValue({ id: 'org-id' } as any);
        mockPrisma.user.update.mockResolvedValue({} as any);

        await expect(service.onboard(dto)).resolves.not.toThrow();
        expect(mockAppService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when slug already exists', async () => {
        mockPrisma.organization.findUnique.mockResolvedValue({ id: 'existing' } as any);
        await expect(service.onboard(baseDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when name already exists', async () => {
        // slug is free, name is taken
        mockPrisma.organization.findUnique
            .mockResolvedValueOnce(null) // slug check
            .mockResolvedValueOnce({ id: 'existing' } as any); // name check
        await expect(service.onboard(baseDto)).rejects.toThrow(ConflictException);
    });

    it('should throw when admin email already has an organization', async () => {
        mockPrisma.organization.findUnique
            .mockResolvedValueOnce(null) // slug check
            .mockResolvedValueOnce(null); // name check
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-id',
            organizationMembers: [{ id: 'mem-1', status: 'ACTIVE' }],
        } as any);
        await expect(service.onboard(baseDto)).rejects.toThrow(InternalServerErrorException);
    });
});
