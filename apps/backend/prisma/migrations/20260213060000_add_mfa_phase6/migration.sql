-- CreateEnum
CREATE TYPE "MfaType" AS ENUM ('TOTP');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "mfa_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MfaType" NOT NULL DEFAULT 'TOTP',
    "name" TEXT NOT NULL DEFAULT 'Authenticator App',
    "totpSecret" TEXT,
    "totpEncryptionIv" TEXT,
    "totpAuthTag" TEXT,
    "backupCodes" TEXT[],
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mfa_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mfa_methods_userId_idx" ON "mfa_methods"("userId");

-- CreateIndex
CREATE INDEX "mfa_methods_userId_enabled_idx" ON "mfa_methods"("userId", "enabled");

-- AddForeignKey
ALTER TABLE "mfa_methods" ADD CONSTRAINT "mfa_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
