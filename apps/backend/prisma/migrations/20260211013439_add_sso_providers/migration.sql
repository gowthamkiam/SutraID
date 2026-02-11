-- CreateEnum
CREATE TYPE "SsoProviderType" AS ENUM ('OKTA', 'AZURE_AD', 'GOOGLE_WORKSPACE', 'GENERIC_SAML', 'GENERIC_OIDC');

-- CreateEnum
CREATE TYPE "SsoProtocol" AS ENUM ('SAML2', 'OIDC');

-- CreateTable
CREATE TABLE "sso_providers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SsoProviderType" NOT NULL,
    "protocol" "SsoProtocol" NOT NULL,
    "samlEntityId" TEXT,
    "samlSsoUrl" TEXT,
    "samlCertificate" TEXT,
    "samlMetadataUrl" TEXT,
    "oidcIssuer" TEXT,
    "oidcClientId" TEXT,
    "oidcClientSecret" TEXT,
    "oidcAuthUrl" TEXT,
    "oidcTokenUrl" TEXT,
    "oidcUserinfoUrl" TEXT,
    "oidcScopes" TEXT[] DEFAULT ARRAY['openid', 'profile', 'email']::TEXT[],
    "attributeMapping" JSONB NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "autoProvision" BOOLEAN NOT NULL DEFAULT true,
    "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sso_identities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ssoProviderId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "externalEmail" TEXT,
    "issuer" TEXT NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "firstLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sso_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sso_providers_organizationId_idx" ON "sso_providers"("organizationId");

-- CreateIndex
CREATE INDEX "sso_providers_organizationId_enabled_idx" ON "sso_providers"("organizationId", "enabled");

-- CreateIndex
CREATE INDEX "sso_identities_userId_idx" ON "sso_identities"("userId");

-- CreateIndex
CREATE INDEX "sso_identities_ssoProviderId_idx" ON "sso_identities"("ssoProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "sso_identities_ssoProviderId_externalId_key" ON "sso_identities"("ssoProviderId", "externalId");

-- AddForeignKey
ALTER TABLE "sso_providers" ADD CONSTRAINT "sso_providers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sso_identities" ADD CONSTRAINT "sso_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sso_identities" ADD CONSTRAINT "sso_identities_ssoProviderId_fkey" FOREIGN KEY ("ssoProviderId") REFERENCES "sso_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
