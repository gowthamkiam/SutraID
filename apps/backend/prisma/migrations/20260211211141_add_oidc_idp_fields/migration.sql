-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "oidcIdpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oidcScopes" TEXT[] DEFAULT ARRAY['openid', 'profile', 'email']::TEXT[];

-- CreateTable
CREATE TABLE "oidc_tokens" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oidc_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "oidc_tokens_organizationId_type_idx" ON "oidc_tokens"("organizationId", "type");

-- CreateIndex
CREATE INDEX "oidc_tokens_expiresAt_idx" ON "oidc_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "oidc_tokens_organizationId_type_tokenId_key" ON "oidc_tokens"("organizationId", "type", "tokenId");
