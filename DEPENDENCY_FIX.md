# 🔧 Dependency Injection Fix

## Problem
Backend was failing to start with error:
```
Error: Nest can't resolve dependencies of the JwtAuthGuard (ConfigService, ?).
Please make sure that the argument AuthService at index [1] is available
in the OrganizationModule context.
```

## Root Cause
Several modules were using `JwtAuthGuard` in their controllers via `@UseGuards(JwtAuthGuard)`, but they weren't importing the `AuthModule` which provides the necessary dependencies (`AuthService` and `JwtAuthGuard`).

Additionally, `AuthModule` itself was missing the `PrismaModule` import, which `AuthService` depends on.

## Files Fixed (4 modules)

### 1. AuthModule
**File**: `apps/backend/src/modules/auth/auth.module.ts`

**Issue**: `AuthService` uses `PrismaService` but module didn't import `PrismaModule`

**Fix**: Added `PrismaModule` to imports
```typescript
@Module({
  imports: [PrismaModule],  // ← Added
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
```

### 2. OrganizationModule
**File**: `apps/backend/src/modules/organization/organization.module.ts`

**Issue**: `OrganizationController` uses `JwtAuthGuard` but module didn't import `AuthModule`

**Fix**: Added `AuthModule` to imports
```typescript
@Module({
  imports: [PrismaModule, AuthModule],  // ← Added AuthModule
  controllers: [OrganizationController],
  providers: [OrganizationService, OrganizationAccessGuard],
  exports: [OrganizationService, OrganizationAccessGuard],
})
export class OrganizationModule {}
```

### 3. SsoModule
**File**: `apps/backend/src/modules/sso/sso.module.ts`

**Issue**: `SsoController` uses `JwtAuthGuard` but module didn't import `AuthModule`

**Fix**: Added `AuthModule` to imports
```typescript
@Module({
  imports: [PrismaModule, OrganizationModule, AuthModule],  // ← Added AuthModule
  controllers: [SsoController, SsoAuthController],
  providers: [SsoService, SamlSpService, OidcClientService],
  exports: [SsoService, SamlSpService, OidcClientService],
})
export class SsoModule {}
```

### 4. ApplicationModule
**File**: `apps/backend/src/modules/application/application.module.ts`

**Issue**: `ApplicationController` uses `JwtAuthGuard` but module didn't import `AuthModule`

**Fix**: Added `AuthModule` to imports
```typescript
@Module({
  imports: [PrismaModule, OrganizationModule, AuthModule],  // ← Added AuthModule
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
```

## Why This Happened

When you use a guard with `@UseGuards(JwtAuthGuard)` in a controller, NestJS needs to:
1. Instantiate the `JwtAuthGuard`
2. Inject its dependencies (in this case, `AuthService`)
3. Have access to all transitive dependencies

If the module containing the controller doesn't import the module that provides the guard and its dependencies, NestJS can't resolve the dependency chain.

## How to Prevent This in Future

**Rule of Thumb**: Any module whose controller uses `@UseGuards(SomeGuard)` must import the module that provides `SomeGuard`.

For `JwtAuthGuard` specifically:
- ✅ Import `AuthModule` in any module that has controllers using `@UseGuards(JwtAuthGuard)`
- ✅ `AuthModule` exports `JwtAuthGuard` to make it available
- ✅ `AuthModule` imports `PrismaModule` because `AuthService` needs `PrismaService`

## Testing the Fix

Try running the backend again:
```bash
cd apps/backend
pnpm run dev
```

You should now see:
```
[Nest] INFO  Application successfully started
[Nest] INFO  Application is running on: http://localhost:3000
```

Instead of the dependency resolution error.

## Note on Node Version

Your system is running Node v12.19.0 (from 2020), which is very old and incompatible with modern tools like Next.js 15 and some pnpm features.

**Recommended**: Update Node.js to v20 LTS or v22 LTS for best compatibility:
```bash
# Using nvm (Node Version Manager)
nvm install 20
nvm use 20

# Or download from: https://nodejs.org/
```

However, for the **backend** to run with `pnpm run dev`, the current Node version might work since it's only using NestJS (older framework). The **frontend** definitely needs Node 18+.

## Summary

✅ **Fixed 4 modules** with missing dependency imports
✅ **Backend should now start** without dependency errors
⚠️ **Node version (v12)** is old but might work for backend
❌ **Frontend requires Node 18+** to run (Next.js 15 requirement)
