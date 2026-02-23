-- CreateEnum
CREATE TYPE "ClaimTarget" AS ENUM ('ID_TOKEN', 'ACCESS_TOKEN', 'USERINFO');

-- CreateEnum
CREATE TYPE "JwsAlgorithm" AS ENUM ('RS256', 'ES256');

-- CreateTable
CREATE TABLE "oidc_scopes" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oidc_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oidc_claims" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userAttribute" TEXT NOT NULL,
    "regexRuleId" TEXT,
    "targetTokens" "ClaimTarget"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oidc_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oidc_regex_rules" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "replacement" TEXT NOT NULL,
    "flags" TEXT NOT NULL DEFAULT 'g',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oidc_regex_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oidc_signing_keys" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "kid" TEXT NOT NULL,
    "algorithm" "JwsAlgorithm" NOT NULL DEFAULT 'RS256',
    "publicKey" TEXT NOT NULL,
    "privateKey" TEXT NOT NULL,
    "certChain" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oidc_signing_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oidc_token_policies" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "accessTokenLifetime" INTEGER NOT NULL DEFAULT 3600,
    "idTokenLifetime" INTEGER NOT NULL DEFAULT 3600,
    "refreshTokenLifetime" INTEGER NOT NULL DEFAULT 2592000,
    "rotationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reuseInterval" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oidc_token_policies_pkey" PRIMARY KEY ("id")
);

-- AlterTable (Update oidc_tokens)
ALTER TABLE "oidc_tokens" ADD COLUMN IF NOT EXISTS "applicationId" TEXT;

-- Update unique index for oidc_tokens
-- Drop the old unique constraint
DROP INDEX IF EXISTS "oidc_tokens_organizationId_type_tokenId_key";

-- Create the new unique index
CREATE UNIQUE INDEX IF NOT EXISTS "oidc_tokens_organizationId_applicationId_type_tokenId_key" 
ON "oidc_tokens"("organizationId", "applicationId", "type", "tokenId");

-- Update other indexes
DROP INDEX IF EXISTS "oidc_tokens_organizationId_type_idx";
CREATE INDEX IF NOT EXISTS "oidc_tokens_organizationId_applicationId_type_idx" 
ON "oidc_tokens"("organizationId", "applicationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "oidc_scopes_applicationId_name_key" ON "oidc_scopes"("applicationId", "name");
CREATE INDEX "oidc_scopes_applicationId_idx" ON "oidc_scopes"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "oidc_claims_applicationId_name_key" ON "oidc_claims"("applicationId", "name");
CREATE INDEX "oidc_claims_applicationId_idx" ON "oidc_claims"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "oidc_regex_rules_applicationId_name_key" ON "oidc_regex_rules"("applicationId", "name");
CREATE INDEX "oidc_regex_rules_applicationId_idx" ON "oidc_regex_rules"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "oidc_signing_keys_applicationId_kid_key" ON "oidc_signing_keys"("applicationId", "kid");
CREATE INDEX "oidc_signing_keys_applicationId_idx" ON "oidc_signing_keys"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "oidc_token_policies_applicationId_key" ON "oidc_token_policies"("applicationId");

-- AddForeignKey
ALTER TABLE "oidc_scopes" ADD CONSTRAINT "oidc_scopes_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oidc_claims" ADD CONSTRAINT "oidc_claims_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oidc_claims" ADD CONSTRAINT "oidc_claims_regexRuleId_fkey" FOREIGN KEY ("regexRuleId") REFERENCES "oidc_regex_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oidc_regex_rules" ADD CONSTRAINT "oidc_regex_rules_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oidc_signing_keys" ADD CONSTRAINT "oidc_signing_keys_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oidc_token_policies" ADD CONSTRAINT "oidc_token_policies_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
