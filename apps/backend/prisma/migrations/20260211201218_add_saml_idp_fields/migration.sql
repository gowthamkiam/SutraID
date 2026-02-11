-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "samlAttributeMapping" JSONB,
ADD COLUMN     "samlIdpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "samlNameIdFormat" TEXT,
ADD COLUMN     "samlSpAcsUrl" TEXT,
ADD COLUMN     "samlSpEntityId" TEXT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "samlIdpCertificate" TEXT,
ADD COLUMN     "samlIdpPrivateKey" TEXT;
