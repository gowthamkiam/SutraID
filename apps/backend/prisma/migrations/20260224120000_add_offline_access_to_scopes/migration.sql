-- Update existing applications to include offline_access scope if not already present
UPDATE "applications"
SET "scopes" = jsonb_insert(
  "scopes"::jsonb,
  '{-1}',
  '"offline_access"'::jsonb
)
WHERE
  "type" = 'OIDC'
  AND NOT ("scopes"::jsonb ? 'offline_access')
  AND "status" != 'ARCHIVED';

-- Note: The schema default for new applications is updated to include offline_access
-- Default: ["openid", "profile", "email", "offline_access"]
