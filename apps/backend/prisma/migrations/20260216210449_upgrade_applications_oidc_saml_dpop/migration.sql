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
-- CreateEnum
CREATE TYPE "DirectoryType" AS ENUM ('SCIM', 'LDAP');

-- CreateEnum
CREATE TYPE "ApplicationProtocol" AS ENUM ('OIDC', 'SAML');

-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('ACCESS', 'SIGN_ON', 'MFA', 'PASSWORD');

-- DropIndex
DROP INDEX "policies_resource_idx";

-- AlterTable
ALTER TABLE "applications" DROP COLUMN "allowedOrigins",
DROP COLUMN "clientSecret",
DROP COLUMN "oidcIdpEnabled",
DROP COLUMN "oidcScopes",
DROP COLUMN "samlIdpEnabled",
ADD COLUMN     "clientSecretHash" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "dpopNonceEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "grantTypes" JSONB NOT NULL DEFAULT '["authorization_code", "refresh_token"]',
ADD COLUMN     "isAiAgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublicClient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jwks" JSONB,
ADD COLUMN     "requireDpop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "responseTypes" JSONB NOT NULL DEFAULT '["code"]',
ADD COLUMN     "samlCertificate" TEXT,
ADD COLUMN     "samlEntityId" TEXT,
ADD COLUMN     "samlPrivateKey" TEXT,
ADD COLUMN     "scopes" JSONB NOT NULL DEFAULT '["openid", "profile", "email"]',
ADD COLUMN     "tokenEndpointAuthMethod" TEXT NOT NULL DEFAULT 'client_secret_post',
ALTER COLUMN "clientId" DROP NOT NULL,
DROP COLUMN "redirectUris",
ADD COLUMN     "redirectUris" JSONB NOT NULL DEFAULT '[]',
DROP COLUMN "type",
ADD COLUMN     "type" "ApplicationProtocol" NOT NULL DEFAULT 'OIDC',
ALTER COLUMN "samlNameIdFormat" SET DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';

-- AlterTable
ALTER TABLE "policies" ADD COLUMN     "rules" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "type" "PolicyType" NOT NULL DEFAULT 'ACCESS',
ALTER COLUMN "resource" SET DEFAULT '*',
ALTER COLUMN "actions" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "agentMetadata" JSONB,
ADD COLUMN     "externalId" TEXT;

-- DropEnum
DROP TYPE "AppType";

-- CreateTable
CREATE TABLE "directory_configs" (
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
CREATE TABLE "groups" (
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
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_policies" (
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
CREATE UNIQUE INDEX "directory_configs_organizationId_key" ON "directory_configs"("organizationId");

-- CreateIndex
CREATE INDEX "directory_configs_organizationId_idx" ON "directory_configs"("organizationId");

-- CreateIndex
CREATE INDEX "groups_organizationId_idx" ON "groups"("organizationId");

-- CreateIndex
CREATE INDEX "groups_externalId_idx" ON "groups"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "groups_organizationId_name_key" ON "groups"("organizationId", "name");

-- CreateIndex
CREATE INDEX "group_members_groupId_idx" ON "group_members"("groupId");

-- CreateIndex
CREATE INDEX "group_members_userId_idx" ON "group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_policies_organizationId_key" ON "password_policies"("organizationId");

-- CreateIndex
CREATE INDEX "users_externalId_idx" ON "users"("externalId");

-- AddForeignKey
ALTER TABLE "directory_configs" ADD CONSTRAINT "directory_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_policies" ADD CONSTRAINT "password_policies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
