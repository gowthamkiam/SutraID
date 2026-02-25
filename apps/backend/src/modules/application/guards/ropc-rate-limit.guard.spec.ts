import { ExecutionContext } from '@nestjs/common';
import { RopcRateLimitGuard } from './ropc-rate-limit.guard';

describe('RopcRateLimitGuard', () => {
  let guard: RopcRateLimitGuard;

  beforeEach(() => {
    // Create guard with minimal mocking — we test the logic methods directly
    guard = new RopcRateLimitGuard(
      {} as any, // ThrottlerOptions
      {} as any, // StorageService
      {} as any, // Reflector
    );
  });

  describe('canActivate', () => {
    const createContext = (body: any): ExecutionContext => ({
      switchToHttp: () => ({
        getRequest: () => ({ body }),
        getResponse: () => ({}),
      }),
      getClass: () => ({} as any),
      getHandler: () => ({} as any),
    } as any);

    it('should return true for non-password grant types', async () => {
      const ctx = createContext({ grant_type: 'authorization_code' });
      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('should return true for client_credentials grant type', async () => {
      const ctx = createContext({ grant_type: 'client_credentials' });
      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('should return true for refresh_token grant type', async () => {
      const ctx = createContext({ grant_type: 'refresh_token' });
      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });

    it('should return true when no grant_type provided', async () => {
      const ctx = createContext({});
      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
    });
  });

  describe('getTracker', () => {
    it('should generate tracker key from IP, client_id, and username', async () => {
      const req = {
        ip: '192.168.1.1',
        body: {
          client_id: 'test-client',
          username: 'user@example.com',
          grant_type: 'password',
        },
      };

      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('ropc:192.168.1.1:test-client:user@example.com');
    });

    it('should use fallback values when fields are missing', async () => {
      const req = {
        body: {},
        connection: { remoteAddress: '10.0.0.1' },
      };

      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('ropc:10.0.0.1:unknown:unknown');
    });

    it('should use "unknown" when no IP available', async () => {
      const req = { body: {} };

      const tracker = await (guard as any).getTracker(req);
      expect(tracker).toBe('ropc:unknown:unknown:unknown');
    });
  });
});
