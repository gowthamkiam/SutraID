-- Single-Tenant Refactor Migration
-- Converts from multi-org to single-org design

-- 1. Create app_config table
CREATE TABLE "app_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL DEFAULT 'SutraID',
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#000000',
    "allowedDomains" TEXT[],
    "samlIdpCertificate" TEXT,
    "samlIdpPrivateKey" TEXT,
    "customLoginConfig" JSONB,
    "mfaRequired" BOOLEAN NOT NULL DEFAULT false,
    "mfaGracePeriodDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- 2. Seed app_config from first organization (if any exist)
INSERT INTO "app_config" ("id", "name", "logoUrl", "primaryColor", "allowedDomains", "samlIdpCertificate", "samlIdpPrivateKey", "customLoginConfig", "mfaRequired", "mfaGracePeriodDays", "updatedAt")
SELECT 'singleton', "name", "logoUrl", "primaryColor", "allowedDomains", "samlIdpCertificate", "samlIdpPrivateKey", "customLoginConfig", "mfaRequired", "mfaGracePeriodDays", NOW()
FROM "organizations"
ORDER BY "createdAt" ASC
LIMIT 1
ON CONFLICT ("id") DO NOTHING;

-- Insert default if no organizations existed
INSERT INTO "app_config" ("id", "updatedAt")
VALUES ('singleton', NOW())
ON CONFLICT ("id") DO NOTHING;

-- 3. Copy role from organization_members to users (use the first membership's role)
UPDATE "users" u
SET "role" = COALESCE(
    (SELECT om."role" FROM "organization_members" om WHERE om."userId" = u."id" ORDER BY om."createdAt" ASC LIMIT 1),
    'READ_ONLY_ADMIN'
);

-- 4. Drop foreign key constraints referencing organizations
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_organizationId_fkey";
ALTER TABLE "directory_configs" DROP CONSTRAINT IF EXISTS "directory_configs_organizationId_fkey";
ALTER TABLE "groups" DROP CONSTRAINT IF EXISTS "groups_organizationId_fkey";
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_organizationId_fkey";
ALTER TABLE "sso_providers" DROP CONSTRAINT IF EXISTS "sso_providers_organizationId_fkey";
ALTER TABLE "policies" DROP CONSTRAINT IF EXISTS "policies_organizationId_fkey";
ALTER TABLE "password_policies" DROP CONSTRAINT IF EXISTS "password_policies_organizationId_fkey";
ALTER TABLE "network_zones" DROP CONSTRAINT IF EXISTS "network_zones_organizationId_fkey";
ALTER TABLE "organization_settings" DROP CONSTRAINT IF EXISTS "organization_settings_organizationId_fkey";
ALTER TABLE "organization_members" DROP CONSTRAINT IF EXISTS "organization_members_organizationId_fkey";
ALTER TABLE "organization_members" DROP CONSTRAINT IF EXISTS "organization_members_userId_fkey";

-- 5. Drop unique constraints that include organizationId
ALTER TABLE "groups" DROP CONSTRAINT IF EXISTS "groups_organizationId_name_key";
ALTER TABLE "organization_settings" DROP CONSTRAINT IF EXISTS "organization_settings_organizationId_key_key";
ALTER TABLE "organization_members" DROP CONSTRAINT IF EXISTS "organization_members_organizationId_userId_key";
ALTER TABLE "oidc_tokens" DROP CONSTRAINT IF EXISTS "oidc_tokens_organizationId_applicationId_type_tokenId_key";

-- 6. Drop indexes that include organizationId
DROP INDEX IF EXISTS "users_organizationId_idx";
DROP INDEX IF EXISTS "directory_configs_organizationId_idx";
DROP INDEX IF EXISTS "groups_organizationId_idx";
DROP INDEX IF EXISTS "applications_organizationId_idx";
DROP INDEX IF EXISTS "sso_providers_organizationId_idx";
DROP INDEX IF EXISTS "sso_providers_organizationId_enabled_idx";
DROP INDEX IF EXISTS "policies_organizationId_idx";
DROP INDEX IF EXISTS "policies_organizationId_enabled_idx";
DROP INDEX IF EXISTS "network_zones_organizationId_idx";
DROP INDEX IF EXISTS "organization_settings_organizationId_idx";
DROP INDEX IF EXISTS "organization_members_organizationId_idx";
DROP INDEX IF EXISTS "organization_members_userId_idx";
DROP INDEX IF EXISTS "audit_logs_organizationId_createdAt_idx";
DROP INDEX IF EXISTS "oidc_tokens_organizationId_applicationId_type_idx";

-- 7. Drop organizationId columns
ALTER TABLE "users" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "directory_configs" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "groups" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "applications" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "sso_providers" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "oidc_tokens" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "policies" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "password_policies" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "network_zones" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "organizationId";

-- 8. Drop multi-tenant tables
DROP TABLE IF EXISTS "organization_settings";
DROP TABLE IF EXISTS "organization_members";
DROP TABLE IF EXISTS "organizations";

-- 9. Add new unique/index constraints
ALTER TABLE "groups" ADD CONSTRAINT "groups_name_key" UNIQUE ("name");
ALTER TABLE "oidc_tokens" ADD CONSTRAINT "oidc_tokens_applicationId_type_tokenId_key" UNIQUE ("applicationId", "type", "tokenId");

CREATE INDEX "sso_providers_enabled_idx" ON "sso_providers"("enabled");
CREATE INDEX "policies_enabled_idx" ON "policies"("enabled");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "oidc_tokens_applicationId_type_idx" ON "oidc_tokens"("applicationId", "type");

-- 10. Remove password_policies unique constraint on organizationId (column already dropped)
ALTER TABLE "password_policies" DROP CONSTRAINT IF EXISTS "password_policies_organizationId_key";
