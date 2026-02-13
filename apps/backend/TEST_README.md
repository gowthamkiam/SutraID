# Backend Testing Guide

## Quick Start

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Run in watch mode (for development)
pnpm test:watch

# Run only unit tests
pnpm test:unit

# Run only E2E tests
pnpm test:e2e
```

## Test Structure

### Unit Tests (`.spec.ts` files)
Unit tests are co-located with source files:
```
src/
  modules/
    auth/
      services/
        auth.service.ts
        auth.service.spec.ts  ← Unit test
```

### E2E Tests (`test/` directory)
Integration and E2E tests are in the test directory:
```
test/
  setup.ts           ← Global test setup
  app.e2e-spec.ts    ← E2E tests
```

## Test Coverage Goals

**Minimum: 80% coverage across all metrics**

- Lines: 80%+
- Branches: 80%+
- Functions: 80%+
- Statements: 80%+

Current coverage is tracked in `coverage/` directory after running `pnpm test:cov`.

## Writing Tests

### Unit Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YourService],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should do something', async () => {
    const result = await service.doSomething();
    expect(result).toBe('expected value');
  });
});
```

### E2E Test Example

```typescript
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Feature (e2e)', () => {
  let app;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/endpoint (GET)', () => {
    return request(app.getHttpServer())
      .get('/endpoint')
      .expect(200);
  });
});
```

## Test Categories

### 1. Service Tests
Test business logic in isolation:
- Auth service (login, registration, password reset)
- Organization service (CRUD, permissions)
- Application service (OAuth apps)
- Policy service (authorization rules)
- SSO service (SAML/OIDC providers)

### 2. Controller Tests
Test HTTP endpoints and request/response handling:
- Request validation
- Response formatting
- Guard integration
- Error handling

### 3. Integration Tests
Test complete workflows:
- User registration and login flow
- Organization creation and management
- Application lifecycle
- Policy enforcement

## Mocking Strategy

### Mock Prisma Service
```typescript
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};
```

### Mock External Services
```typescript
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'test-id' }),
    },
  })),
}));
```

## Environment Setup

Tests use environment variables from `test/setup.ts`:
```typescript
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
```

## Common Assertions

```typescript
// Service method called
expect(service.method).toHaveBeenCalledWith(arg1, arg2);

// Response structure
expect(result).toHaveProperty('property', 'value');

// Array length
expect(results).toHaveLength(3);

// Error thrown
await expect(service.method()).rejects.toThrow(NotFoundException);

// HTTP response
expect(response.status).toBe(200);
expect(response.body).toMatchObject({ key: 'value' });
```

## Debugging Tests

### Run specific test file
```bash
pnpm test auth.service.spec.ts
```

### Run specific test case
```bash
pnpm test -t "should login user"
```

### View detailed output
```bash
pnpm test --verbose
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

## Coverage Report

After running `pnpm test:cov`, view coverage:
```bash
open coverage/lcov-report/index.html
```

Coverage breakdown:
- **Green**: 80%+ coverage
- **Yellow**: 50-80% coverage
- **Red**: <50% coverage

## CI/CD Integration

Tests run automatically on:
- Push to any branch
- Pull request creation
- Pre-deployment checks

CI fails if:
- Any test fails
- Coverage drops below 80%
- Linting errors exist

## Best Practices

### 1. Test Independence
- Each test should run independently
- Don't rely on test execution order
- Clean up after tests

### 2. Clear Naming
```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return access token for valid credentials', () => {});
    it('should throw UnauthorizedException for invalid credentials', () => {});
  });
});
```

### 3. AAA Pattern
```typescript
it('should do something', async () => {
  // Arrange
  const input = { data: 'test' };
  
  // Act
  const result = await service.method(input);
  
  // Assert
  expect(result).toBe('expected');
});
```

### 4. Mock Cleanup
```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

### 5. Test Data
Use factories or builders for test data:
```typescript
const createTestUser = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'Password123!',
  ...overrides,
});
```

## Troubleshooting

### Issue: Tests timeout
**Solution**: Increase timeout in test or jest.config.js
```typescript
jest.setTimeout(30000);
```

### Issue: Mock not working
**Solution**: Ensure mock is defined before imports
```typescript
jest.mock('./service');
import { Service } from './service';
```

### Issue: Database errors in tests
**Solution**: Check DATABASE_URL and Prisma setup
```bash
npx prisma generate
```

### Issue: Flaky tests
**Solution**: 
- Avoid time-based logic
- Use fixed dates in tests
- Mock external calls
- Ensure proper cleanup

## Additional Resources

- [NestJS Testing Docs](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- Full coverage details: [TEST_COVERAGE.md](./TEST_COVERAGE.md)

## Support

For questions or issues:
1. Check existing test examples
2. Review documentation above
3. Run tests with `--verbose` flag
4. Check CI logs for details
