-- AlterTable: Change default refreshTokenLifetime from 30 days (2592000) to 24 hours (86400)
ALTER TABLE "oidc_token_policies" ALTER COLUMN "refreshTokenLifetime" SET DEFAULT 86400;
