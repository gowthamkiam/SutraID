-- Add first-login password enforcement column
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- User <-> Application assignments
CREATE TABLE IF NOT EXISTS "user_application_assignments" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_application_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_application_assignments_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_application_assignments_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "applications"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_application_assignments_userId_applicationId_key"
  ON "user_application_assignments"("userId", "applicationId");
CREATE INDEX IF NOT EXISTS "user_application_assignments_userId_idx"
  ON "user_application_assignments"("userId");
CREATE INDEX IF NOT EXISTS "user_application_assignments_applicationId_idx"
  ON "user_application_assignments"("applicationId");

-- Group <-> Application assignments
CREATE TABLE IF NOT EXISTS "group_application_assignments" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "group_application_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "group_application_assignments_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "groups"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "group_application_assignments_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "applications"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "group_application_assignments_groupId_applicationId_key"
  ON "group_application_assignments"("groupId", "applicationId");
CREATE INDEX IF NOT EXISTS "group_application_assignments_groupId_idx"
  ON "group_application_assignments"("groupId");
CREATE INDEX IF NOT EXISTS "group_application_assignments_applicationId_idx"
  ON "group_application_assignments"("applicationId");
