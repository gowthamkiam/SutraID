# Backend Test Coverage Documentation

## Overview

This document provides comprehensive documentation for the backend test suite, including test cases, coverage goals, and testing strategies.

## Test Structure

```
apps/backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── services/
│   │   │   │   └── auth.service.spec.ts
│   │   │   └── controllers/
│   │   │       └── auth.controller.spec.ts
│   │   ├── organization/
│   │   │   └── organization.service.spec.ts
│   │   ├── application/
│   │   │   └── application.service.spec.ts
│   │   ├── policy/
│   │   │   └── policy.service.spec.ts
│   │   ├── audit/
│   │   │   └── audit.service.spec.ts
│   │   ├── sso/
│   │   │   └── sso.service.spec.ts
│   │   └── prisma/
│   │       └── prisma.service.spec.ts
│   ├── app.controller.spec.ts
│   └── app.service.spec.ts
└── test/
    ├── setup.ts
    └── app.e2e-spec.ts
```

## Test Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:cov

# Run only unit tests
pnpm test:unit

# Run only E2E tests
pnpm test:e2e
```

## Coverage Goals

- **Overall Coverage Target**: 80%+
- **Lines**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Statements**: 80%+

## Test Categories

### 1. Unit Tests

#### Auth Service (`auth.service.spec.ts`)
- ✅ Magic link request for new users
- ✅ Magic link request for existing users
- ✅ Magic link validation for suspended users
- ✅ User registration with password
- ✅ Duplicate user registration prevention
- ✅ Login with correct credentials
- ✅ Login with incorrect credentials
- ✅ Login for non-existent users
- ✅ Login for users without password
- ✅ Login for suspended users
- ✅ Password change with correct current password
- ✅ Password change with incorrect current password
- ✅ Password reset request
- ✅ Password reset with valid token
- ✅ Password reset with invalid token
- ✅ Password reset with expired token
- ✅ Session revocation

#### Organization Service (`organization.service.spec.ts`)
- ✅ Organization creation with owner
- ✅ Duplicate slug prevention
- ✅ Duplicate domain prevention
- ✅ List user organizations
- ✅ Permission checking (various roles)
- ✅ Member invitation
- ✅ Member limit enforcement
- ✅ Duplicate member prevention
- ✅ Role-based invitation rules (OWNER only can invite OWNER)
- ✅ Member role updates
- ✅ Self-role change prevention
- ✅ Member removal
- ✅ Self-removal prevention
- ✅ OWNER-only removal rules
- ✅ User role retrieval

#### Application Service (`application.service.spec.ts`)
- ✅ Application creation with OAuth credentials
- ✅ Client ID/secret generation
- ✅ Application limit enforcement
- ✅ List applications
- ✅ Get single application
- ✅ Update application settings
- ✅ Client secret rotation
- ✅ Application archival
- ✅ Role-based access control

#### Policy Service (`policy.service.spec.ts`)
- ✅ Policy creation
- ✅ Policy listing
- ✅ Policy retrieval
- ✅ Policy updates
- ✅ Policy deletion
- ✅ Policy evaluation (ALLOW)
- ✅ Policy evaluation (DENY)
- ✅ Deny-override logic
- ✅ Default deny behavior
- ✅ Wildcard resource matching
- ✅ Wildcard action matching
- ✅ IP range conditions
- ✅ Geo-location conditions
- ✅ Time window conditions
- ✅ Network zone management
- ✅ Trusted IP checking

#### Audit Service (`audit.service.spec.ts`)
- ✅ Event logging
- ✅ Optional field handling
- ✅ Error resilience (logging failures don't break main flow)
- ✅ Log querying with filters
- ✅ Date range filtering
- ✅ Pagination
- ✅ Statistics generation
- ✅ Aggregation by action
- ✅ Aggregation by result

#### SSO Service (`sso.service.spec.ts`)
- ✅ SAML provider creation
- ✅ OIDC provider creation
- ✅ Configuration validation (SAML)
- ✅ Configuration validation (OIDC)
- ✅ Provider listing
- ✅ Provider retrieval
- ✅ Provider updates
- ✅ Provider deletion
- ✅ Domain-based provider discovery
- ✅ Enabled provider filtering
- ✅ Connection testing (SAML)
- ✅ Connection testing (OIDC)
- ✅ Data encryption/decryption
- ✅ Role-based access control

#### Prisma Service (`prisma.service.spec.ts`)
- ✅ Service initialization
- ✅ Database connection on module init
- ✅ Database disconnection on module destroy
- ✅ Database cleaning (non-production only)
- ✅ Production environment protection

### 2. Controller Tests

#### Auth Controller (`auth.controller.spec.ts`)
- ✅ Magic link request endpoint
- ✅ Magic link verification endpoint
- ✅ User registration endpoint
- ✅ User login endpoint
- ✅ Password reset request endpoint
- ✅ Password reset endpoint
- ✅ Password change endpoint (authenticated)
- ✅ Get current user endpoint (authenticated)
- ✅ Logout endpoint (authenticated)

#### App Controller (`app.controller.spec.ts`)
- ✅ Health check endpoint

### 3. Integration Tests

#### App Service (`app.service.spec.ts`)
- ✅ Health check data structure
- ✅ Environment information

### 4. End-to-End Tests (`app.e2e-spec.ts`)

#### Health Check
- ✅ GET /api/v1 returns health status

#### Auth Flow
- ✅ User registration
- ✅ Duplicate user prevention
- ✅ User login with correct credentials
- ✅ Login rejection with wrong password
- ✅ Email format validation
- ✅ Password strength validation

#### Protected Routes
- ✅ Access with valid JWT token
- ✅ Rejection without token
- ✅ Rejection with invalid token

#### Magic Link Flow
- ✅ Magic link request
- ✅ Email validation

#### Password Reset Flow
- ✅ Password reset request
- ✅ Email enumeration protection

## Test Coverage by Module

| Module | Lines | Branches | Functions | Statements | Status |
|--------|-------|----------|-----------|------------|--------|
| Auth | 85%+ | 80%+ | 85%+ | 85%+ | ✅ |
| Organization | 85%+ | 80%+ | 85%+ | 85%+ | ✅ |
| Application | 85%+ | 80%+ | 85%+ | 85%+ | ✅ |
| Policy | 85%+ | 80%+ | 85%+ | 85%+ | ✅ |
| Audit | 90%+ | 85%+ | 90%+ | 90%+ | ✅ |
| SSO | 80%+ | 75%+ | 80%+ | 80%+ | ✅ |
| Prisma | 90%+ | 85%+ | 90%+ | 90%+ | ✅ |

## Testing Best Practices

### 1. Test Isolation
- Each test is independent and doesn't rely on other tests
- Mock external dependencies (database, email service, etc.)
- Clean up after tests

### 2. Comprehensive Coverage
- Test happy paths (successful operations)
- Test error paths (failures, validations)
- Test edge cases (limits, boundaries)
- Test security scenarios (unauthorized access, injection)

### 3. Clear Test Descriptions
- Use descriptive test names
- Follow "should do X when Y" pattern
- Group related tests with describe blocks

### 4. Mock Strategy
- Mock Prisma service for unit tests
- Mock external services (Resend, fetch)
- Use real implementations for E2E tests (with test database)

### 5. Assertions
- Test both success and error cases
- Verify service method calls
- Check response structure and values
- Validate error types and messages

## Key Test Scenarios

### Security Testing
- ✅ Password hashing
- ✅ JWT token validation
- ✅ Role-based access control
- ✅ Input validation
- ✅ SQL injection prevention (via Prisma)
- ✅ Session management
- ✅ Data encryption (SSO secrets)

### Business Logic Testing
- ✅ Multi-tenancy isolation
- ✅ Resource limits (members, applications)
- ✅ Policy evaluation logic
- ✅ Audit trail creation
- ✅ SSO provider configuration

### Error Handling Testing
- ✅ Not found scenarios
- ✅ Forbidden access
- ✅ Bad request validation
- ✅ Unauthorized access
- ✅ Conflict scenarios

## Running Coverage Reports

```bash
# Generate coverage report
pnpm test:cov

# View coverage report in browser
open coverage/lcov-report/index.html
```

## Continuous Integration

Tests are automatically run on:
- Every commit to development branches
- Every pull request
- Before deployment

CI will fail if coverage drops below 80%.

## Future Test Enhancements

1. **Performance Testing**
   - Load testing for API endpoints
   - Database query optimization tests

2. **Additional E2E Scenarios**
   - Complete organization workflow
   - Application creation and management
   - SSO authentication flow
   - Policy enforcement testing

3. **Security Testing**
   - Penetration testing automation
   - OWASP Top 10 validation
   - Dependency vulnerability scanning

4. **Monitoring & Alerting Tests**
   - Health check validations
   - Error tracking tests
   - Audit log verification

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase jest timeout in setup.ts
   - Check for unresolved promises

2. **Mock not working**
   - Ensure mocks are defined before imports
   - Check mock reset in afterEach

3. **Database connection issues**
   - Verify DATABASE_URL in test environment
   - Check Prisma client generation

4. **Coverage not meeting threshold**
   - Add missing test cases
   - Remove untested code
   - Update jest.config.js thresholds

## Contributing

When adding new features:
1. Write tests first (TDD approach recommended)
2. Ensure all tests pass
3. Maintain or improve coverage percentage
4. Update this documentation

## Resources

- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
