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
        appConfig: {
            upsert: jest.fn(),
            findUnique: jest.fn(),
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
        adminEmail: 'admin@example.com',
    };

    it('should successfully onboard', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({ id: 'user-id', email: baseDto.adminEmail } as any);
        mockPrisma.appConfig.upsert.mockResolvedValue({ id: 'singleton' } as any);

        await expect(service.onboard(baseDto)).resolves.not.toThrow();
        expect(mockPrisma.appConfig.upsert).toHaveBeenCalled();
        expect(mockAuthService.requestMagicLink).toHaveBeenCalledWith(baseDto.adminEmail);
    });

    it('should throw ConflictException when admin email already exists', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' } as any);
        await expect(service.onboard(baseDto)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException on database error', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockRejectedValue(new Error('Db error'));
        await expect(service.onboard(baseDto)).rejects.toThrow(InternalServerErrorException);
    });
});
