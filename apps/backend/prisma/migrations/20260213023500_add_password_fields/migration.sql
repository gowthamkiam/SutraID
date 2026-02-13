-- AlterTable
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "users" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

-- AlterEnum
ALTER TYPE "ChallengeType" ADD VALUE 'PASSWORD_RESET';
