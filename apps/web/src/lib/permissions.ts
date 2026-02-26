import { OrgRole } from './api';

/**
 * RBAC Permission Matrix (must match backend)
 */
const PERMISSION_MATRIX: Record<OrgRole, string[]> = {
  SUPER_ADMIN: ['*'],
  ORG_ADMIN: [
    'users:*', 'groups:*', 'org:*', 'apps:*', 'sso:*',
    'policies:*', 'audit:read', 'directory:*', 'settings:*',
  ],
  APP_ADMIN: [
    'apps:*', 'sso:*', 'org:read', 'settings:read',
  ],
  USER_ADMIN: [
    'users:*', 'groups:read', 'org:read', 'settings:read',
  ],
  GROUP_MEMBERSHIP_ADMIN: [
    'groups:*', 'users:read', 'org:read', 'settings:read',
  ],
  HELP_DESK_ADMIN: [
    'users:read', 'users:update', 'org:read', 'settings:read',
  ],
  MOBILE_ADMIN: [
    'apps:read', 'apps:update', 'org:read', 'settings:read',
  ],
  READ_ONLY_ADMIN: [
    'users:read', 'groups:read', 'apps:read', 'org:read',
    'audit:read', 'policies:read', 'settings:read',
  ],
  REPORT_ADMIN: [
    'audit:*', 'users:read', 'apps:read', 'org:read', 'settings:read',
  ],
  API_ACCESS_MANAGEMENT_ADMIN: [
    'apps:*', 'sso:*', 'directory:*', 'org:read', 'settings:read',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: OrgRole | null | undefined, requiredPermission: string): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;

  const permissions = PERMISSION_MATRIX[role];
  if (!permissions) return false;

  if (permissions.includes('*')) return true;

  const [resource, action] = requiredPermission.split(':');

  return permissions.some((perm) => {
    const [permResource, permAction] = perm.split(':');
    if (permResource !== resource) return false;
    return permAction === '*' || permAction === action;
  });
}

/**
 * Check if role can perform any mutation (create/update/delete)
 */
export function canMutate(role: OrgRole | null | undefined, resource: string): boolean {
  return (
    hasPermission(role, `${resource}:create`) ||
    hasPermission(role, `${resource}:update`) ||
    hasPermission(role, `${resource}:delete`)
  );
}

/**
 * Check if role is read-only
 */
export function isReadOnly(role: OrgRole | null | undefined): boolean {
  return role === 'READ_ONLY_ADMIN';
}
