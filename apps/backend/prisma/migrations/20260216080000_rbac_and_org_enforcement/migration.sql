-- AlterEnum: Replace OrgRole with expanded RBAC roles

-- Step 1: Drop the existing default on the role column (it references the old enum)
ALTER TABLE "organization_members"
  ALTER COLUMN "role" DROP DEFAULT;

-- Step 2: Rename old enum
ALTER TYPE "OrgRole" RENAME TO "OrgRole_old";

-- Step 3: Create new enum with all roles
CREATE TYPE "OrgRole" AS ENUM (
  'SUPER_ADMIN',
  'ORG_ADMIN',
  'APP_ADMIN',
  'USER_ADMIN',
  'GROUP_MEMBERSHIP_ADMIN',
  'HELP_DESK_ADMIN',
  'MOBILE_ADMIN',
  'READ_ONLY_ADMIN',
  'REPORT_ADMIN',
  'API_ACCESS_MANAGEMENT_ADMIN'
);

-- Step 4: Migrate existing data, mapping old roles to new
ALTER TABLE "organization_members"
  ALTER COLUMN "role" TYPE "OrgRole"
  USING (
    CASE "role"::text
      WHEN 'OWNER' THEN 'SUPER_ADMIN'
      WHEN 'ADMIN' THEN 'ORG_ADMIN'
      WHEN 'DEVELOPER' THEN 'APP_ADMIN'
      WHEN 'MEMBER' THEN 'READ_ONLY_ADMIN'
      ELSE 'READ_ONLY_ADMIN'
    END
  )::"OrgRole";

-- Step 5: Set new default value
ALTER TABLE "organization_members"
  ALTER COLUMN "role" SET DEFAULT 'READ_ONLY_ADMIN'::"OrgRole";

-- Step 6: Drop old enum
DROP TYPE "OrgRole_old";

