-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "allowClientCredentials" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowROPC" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowRefreshForROPC" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pkceRequired" BOOLEAN NOT NULL DEFAULT true;

-- Data migration: enable client_credentials for apps that already have it in grantTypes
UPDATE "applications"
SET "allowClientCredentials" = true
WHERE "grantTypes"::text LIKE '%client_credentials%';
