import { OrgRole } from '@prisma/client';

/**
 * RBAC Permission Matrix
 * Format: 'resource:action'
 * Wildcard 'resource:*' grants all actions on that resource
 * SUPER_ADMIN bypasses this matrix entirely (handled in guard)
 */
export const PERMISSION_MATRIX: Record<string, string[]> = {
  [OrgRole.ORG_ADMIN]: [
    'users:*', 'groups:*', 'org:*', 'apps:*', 'sso:*',
    'policies:*', 'audit:read', 'directory:*', 'settings:*',
  ],
  [OrgRole.APP_ADMIN]: [
    'apps:*', 'sso:*',
  ],
  [OrgRole.USER_ADMIN]: [
    'users:*', 'groups:read',
  ],
  [OrgRole.GROUP_MEMBERSHIP_ADMIN]: [
    'groups:*', 'users:read',
  ],
  [OrgRole.HELP_DESK_ADMIN]: [
    'users:read', 'users:update',
  ],
  [OrgRole.MOBILE_ADMIN]: [
    'apps:read', 'apps:update',
  ],
  [OrgRole.READ_ONLY_ADMIN]: [
    'users:read', 'groups:read', 'apps:read', 'org:read',
    'audit:read', 'policies:read', 'settings:read',
  ],
  [OrgRole.REPORT_ADMIN]: [
    'audit:*', 'users:read', 'apps:read',
  ],
  [OrgRole.API_ACCESS_MANAGEMENT_ADMIN]: [
    'apps:*', 'sso:*', 'directory:*',
  ],
};

/**
 * Check if a role's permissions include the required permission.
 * Supports wildcards: 'users:*' matches 'users:create', 'users:read', etc.
 */
export function hasPermission(role: OrgRole, requiredPermission: string): boolean {
  if (role === OrgRole.SUPER_ADMIN) return true;

  const permissions = PERMISSION_MATRIX[role];
  if (!permissions) return false;

  const [resource, action] = requiredPermission.split(':');

  return permissions.some((perm) => {
    const [permResource, permAction] = perm.split(':');
    if (permResource !== resource) return false;
    return permAction === '*' || permAction === action;
  });
}

/**
 * Role-to-sidebar-tabs mapping for frontend reference.
 * SUPER_ADMIN and ORG_ADMIN see all tabs.
 */
export const ROLE_VISIBLE_TABS: Record<string, string[]> = {
  [OrgRole.SUPER_ADMIN]: ['*'],
  [OrgRole.ORG_ADMIN]: ['*'],
  [OrgRole.APP_ADMIN]: ['dashboard', 'applications', 'sso', 'settings'],
  [OrgRole.USER_ADMIN]: ['dashboard', 'users', 'groups', 'directory', 'settings'],
  [OrgRole.GROUP_MEMBERSHIP_ADMIN]: ['dashboard', 'users', 'groups', 'directory', 'settings'],
  [OrgRole.HELP_DESK_ADMIN]: ['dashboard', 'users', 'settings'],
  [OrgRole.MOBILE_ADMIN]: ['dashboard', 'applications', 'settings'],
  [OrgRole.READ_ONLY_ADMIN]: ['dashboard', 'users', 'applications', 'audit_logs', 'policies', 'settings'],
  [OrgRole.REPORT_ADMIN]: ['dashboard', 'audit_logs', 'users', 'applications', 'settings'],
  [OrgRole.API_ACCESS_MANAGEMENT_ADMIN]: ['dashboard', 'applications', 'sso', 'directory', 'settings'],
};
