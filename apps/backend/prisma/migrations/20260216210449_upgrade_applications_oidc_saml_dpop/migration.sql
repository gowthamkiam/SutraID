/*
  Warnings:

  - You are about to drop the column `allowedOrigins` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `clientSecret` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `oidcIdpEnabled` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `oidcScopes` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `samlIdpEnabled` on the `applications` table. All the data in the column will be lost.
  - The `redirectUris` column on the `applications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `applications` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- Create enum types (idempotent for drifted/partially-migrated environments)
DO $$
BEGIN
    CREATE TYPE "DirectoryType" AS ENUM ('SCIM', 'LDAP');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "ApplicationProtocol" AS ENUM ('OIDC', 'SAML');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "PolicyType" AS ENUM ('ACCESS', 'SIGN_ON', 'MFA', 'PASSWORD');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- DropIndex
DROP INDEX IF EXISTS "policies_resource_idx";

-- AlterTable
ALTER TABLE "applications" DROP COLUMN IF EXISTS "allowedOrigins",
DROP COLUMN IF EXISTS "clientSecret",
DROP COLUMN IF EXISTS "oidcIdpEnabled",
DROP COLUMN IF EXISTS "oidcScopes",
DROP COLUMN IF EXISTS "samlIdpEnabled",
ADD COLUMN IF NOT EXISTS "clientSecretHash" TEXT,
ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
ADD COLUMN IF NOT EXISTS "dpopNonceEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "grantTypes" JSONB NOT NULL DEFAULT '["authorization_code", "refresh_token"]',
ADD COLUMN IF NOT EXISTS "isAiAgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isPublicClient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "jwks" JSONB,
ADD COLUMN IF NOT EXISTS "requireDpop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "responseTypes" JSONB NOT NULL DEFAULT '["code"]',
ADD COLUMN IF NOT EXISTS "samlCertificate" TEXT,
ADD COLUMN IF NOT EXISTS "samlEntityId" TEXT,
ADD COLUMN IF NOT EXISTS "samlPrivateKey" TEXT,
ADD COLUMN IF NOT EXISTS "scopes" JSONB NOT NULL DEFAULT '["openid", "profile", "email"]',
ADD COLUMN IF NOT EXISTS "tokenEndpointAuthMethod" TEXT NOT NULL DEFAULT 'client_secret_post',
ALTER COLUMN "clientId" DROP NOT NULL,
DROP COLUMN IF EXISTS "redirectUris",
ADD COLUMN IF NOT EXISTS "redirectUris" JSONB NOT NULL DEFAULT '[]',
DROP COLUMN IF EXISTS "type",
ADD COLUMN IF NOT EXISTS "type" "ApplicationProtocol" NOT NULL DEFAULT 'OIDC',
ALTER COLUMN "samlNameIdFormat" SET DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';

-- AlterTable
ALTER TABLE "policies" ADD COLUMN IF NOT EXISTS "rules" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "type" "PolicyType" NOT NULL DEFAULT 'ACCESS',
ALTER COLUMN "resource" SET DEFAULT '*',
ALTER COLUMN "actions" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "agentMetadata" JSONB,
ADD COLUMN IF NOT EXISTS "externalId" TEXT;

-- DropEnum
DROP TYPE IF EXISTS "AppType";

-- CreateTable
CREATE TABLE IF NOT EXISTS "directory_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "DirectoryType" NOT NULL DEFAULT 'SCIM',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "scimToken" TEXT,
    "ldapUrl" TEXT,
    "ldapBaseDn" TEXT,
    "ldapBindDn" TEXT,
    "ldapBindPassword" TEXT,
    "ldapUserFilter" TEXT DEFAULT '(objectClass=user)',
    "ldapGroupFilter" TEXT DEFAULT '(objectClass=group)',
    "syncInterval" INTEGER NOT NULL DEFAULT 60,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directory_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "groups" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "password_policies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "minLength" INTEGER NOT NULL DEFAULT 8,
    "requireUppercase" BOOLEAN NOT NULL DEFAULT true,
    "requireLowercase" BOOLEAN NOT NULL DEFAULT true,
    "requireNumbers" BOOLEAN NOT NULL DEFAULT true,
    "requireSymbols" BOOLEAN NOT NULL DEFAULT true,
    "maxAgeDays" INTEGER NOT NULL DEFAULT 0,
    "historyCount" INTEGER NOT NULL DEFAULT 5,
    "lockoutThreshold" INTEGER NOT NULL DEFAULT 5,
    "lockoutDuration" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "directory_configs_organizationId_key" ON "directory_configs"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "directory_configs_organizationId_idx" ON "directory_configs"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "groups_organizationId_idx" ON "groups"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "groups_externalId_idx" ON "groups"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "groups_organizationId_name_key" ON "groups"("organizationId", "name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "group_members_groupId_idx" ON "group_members"("groupId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "group_members_userId_idx" ON "group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "password_policies_organizationId_key" ON "password_policies"("organizationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_externalId_idx" ON "users"("externalId");

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "directory_configs" ADD CONSTRAINT "directory_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "groups" ADD CONSTRAINT "groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$
BEGIN
    ALTER TABLE "password_policies" ADD CONSTRAINT "password_policies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
