import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    // Mock the connection methods
    service.$connect = jest.fn();
    service.$disconnect = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should connect to database on module init', async () => {
      await service.onModuleInit();
      expect(service.$connect).toHaveBeenCalled();
    });

    it('should disconnect from database on module destroy', async () => {
      await service.onModuleDestroy();
      expect(service.$disconnect).toHaveBeenCalled();
    });
  });

  describe('cleanDatabase', () => {
    it('should throw error in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await expect(service.cleanDatabase()).rejects.toThrow(
        'Cannot clean database in production!',
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should clean database in non-production environment', async () => {
      process.env.NODE_ENV = 'test';
      
      // Mock deleteMany methods
      (service as any).session = { deleteMany: jest.fn() };
      (service as any).authChallenge = { deleteMany: jest.fn() };
      (service as any).user = { deleteMany: jest.fn() };

      await service.cleanDatabase();

      expect((service as any).session.deleteMany).toHaveBeenCalled();
      expect((service as any).authChallenge.deleteMany).toHaveBeenCalled();
      expect((service as any).user.deleteMany).toHaveBeenCalled();
    });
  });
});
