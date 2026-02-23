-- Core org enforcement
-- Create groups table if it doesn't exist yet (fix dependency error)
CREATE TABLE IF NOT EXISTS "groups" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "groups_organizationId_idx" ON "groups"("organizationId");
CREATE INDEX IF NOT EXISTS "groups_externalId_idx" ON "groups"("externalId");
CREATE UNIQUE INDEX IF NOT EXISTS "groups_organizationId_name_key" ON "groups"("organizationId", "name");

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT,
  ADD COLUMN IF NOT EXISTS "role" "OrgRole" NOT NULL DEFAULT 'READ_ONLY_ADMIN';

ALTER TABLE "users"
  ADD CONSTRAINT "users_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "users_organizationId_idx" ON "users"("organizationId");

ALTER TABLE "organizations"
  ADD CONSTRAINT "organizations_name_key" UNIQUE ("name");

CREATE TABLE IF NOT EXISTS "user_groups" (
  "userId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_groups_pkey" PRIMARY KEY ("userId","groupId"),
  CONSTRAINT "user_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "user_groups_userId_idx" ON "user_groups"("userId");
CREATE INDEX IF NOT EXISTS "user_groups_groupId_idx" ON "user_groups"("groupId");
