import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health check object', () => {
      const result = service.getHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('service');
      expect(result).toHaveProperty('version');
    });

    it('should include service information', () => {
      const result = service.getHealth();

      expect(result.service).toBe('SutraID Backend API');
      expect(result.version).toBe('0.1.0');
    });
  });

  describe('getWelcome', () => {
    it('should return welcome message', () => {
      const result = service.getWelcome();

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('documentation');
      expect(result).toHaveProperty('health');
    });
  });
});
