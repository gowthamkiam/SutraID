# Database Migration Fix - Missing Password Fields

## Issue
The `passwordHash` and `passwordChangedAt` columns were missing from the `users` table in the database, causing authentication failures.

## Root Cause
The initial migration (`20260210015639_dev`) did not include these fields, even though they were present in the Prisma schema.

## Solution
Created migration `20260213023500_add_password_fields` to add the missing columns.

## Manual Steps Required

Since this is a running production/staging database, you need to apply the migration manually:

### Option 1: Using Prisma Migrate (Recommended)
```bash
cd apps/backend
npx prisma migrate deploy
```

### Option 2: Manual SQL Execution
If the above doesn't work, run this SQL directly on your database:

```sql
-- Add missing password fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

-- Add PASSWORD_RESET enum value if it doesn't exist
ALTER TYPE "ChallengeType" ADD VALUE IF NOT EXISTS 'PASSWORD_RESET';
```

### Option 3: Using psql
```bash
psql $DATABASE_URL -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordHash TEXT;"
psql $DATABASE_URL -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordChangedAt TIMESTAMP(3);"
```

## Verification
After applying the migration, verify with:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('passwordHash', 'passwordChangedAt');
```

You should see both columns listed.

## Next Steps
1. Apply the migration to your database
2. Restart the backend service
3. Test user registration with password
4. Test login with password

## Prevention
This issue occurred because the Prisma schema and the initial migration were out of sync. In the future:
- Always run `prisma migrate dev` after schema changes
- Verify migrations include all schema changes before committing
- Use `prisma db push` for development environments to sync schema quickly
