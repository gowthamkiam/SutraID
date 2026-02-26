'use client';

import { useEffect, useMemo, useState } from 'react';
import { applicationApi, Application, OrgRole, groupsApi, usersApi } from '@/lib/api';
import { useOrg } from '@/components/providers/OrgContextProvider';
import { hasPermission } from '@/lib/permissions';

const roles: OrgRole[] = [
  'SUPER_ADMIN',
  'ORG_ADMIN',
  'APP_ADMIN',
  'USER_ADMIN',
  'GROUP_MEMBERSHIP_ADMIN',
  'API_ACCESS_MANAGEMENT_ADMIN',
  'REPORT_ADMIN',
  'HELP_DESK_ADMIN',
  'MOBILE_ADMIN',
  'READ_ONLY_ADMIN',
];

type OnboardingMethod = 'MAGIC_LINK' | 'TEMP_PASSWORD';

export default function UsersPage() {
  const { orgRole } = useOrg();
  const canCreate = hasPermission(orgRole as OrgRole, 'users:create');
  const canUpdate = hasPermission(orgRole as OrgRole, 'users:update');
  const canDelete = hasPermission(orgRole as OrgRole, 'users:delete');

  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'READ_ONLY_ADMIN' as OrgRole,
    groupIds: [] as string[],
    applicationIds: [] as string[],
    onboardingMethod: 'MAGIC_LINK' as OnboardingMethod,
    temporaryPassword: '',
  });

  const applicationOptions = useMemo(
    () => applications.filter((app) => app.status !== 'ARCHIVED').map((app) => ({ value: app.id, label: app.name })),
    [applications],
  );

  const groupOptions = useMemo(() => groups.map((g) => ({ value: g.id, label: g.name })), [groups]);

  useEffect(() => {
    setOrgId(localStorage.getItem('currentOrgId'));
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResult, groupsResult, appResult] = await Promise.all([
        usersApi.list({ search, role: (roleFilter || undefined) as OrgRole | undefined, page, limit: 10 }),
        groupsApi.list({ page: 1, limit: 200 }),
        orgId ? applicationApi.list(orgId) : Promise.resolve([] as Application[]),
      ]);

      setUsers(usersResult.users);
      setTotalPages(usersResult.totalPages || 1);
      setGroups(groupsResult.groups);
      setApplications(appResult);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    loadData();
  }, [page, orgId]);

  const resetForm = () => {
    setForm({
      email: '',
      firstName: '',
      lastName: '',
      role: 'READ_ONLY_ADMIN',
      groupIds: [],
      applicationIds: [],
      onboardingMethod: 'MAGIC_LINK',
      temporaryPassword: '',
    });
    setEditingUser(null);
  };

  const onCreate = async () => {
    await usersApi.create({
      email: form.email,
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      role: form.role,
      groupIds: form.groupIds,
      applicationIds: form.applicationIds,
      onboardingMethod: form.onboardingMethod,
      temporaryPassword: form.onboardingMethod === 'TEMP_PASSWORD' ? form.temporaryPassword : undefined,
    });
    setOpenCreate(false);
    resetForm();
    loadData();
  };

  const onUpdate = async () => {
    if (!editingUser) return;
    await usersApi.update(editingUser.id, {
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      role: form.role,
      groupIds: form.groupIds,
      applicationIds: form.applicationIds,
    });
    setEditingUser(null);
    resetForm();
    loadData();
  };

  const onDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    await usersApi.remove(id);
    loadData();
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setOpenCreate(false);
    setForm({
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      groupIds: user.groups?.map((g: any) => g.id) || [],
      applicationIds: user.applications?.map((app: any) => app.id) || [],
      onboardingMethod: 'MAGIC_LINK',
      temporaryPassword: '',
    });
  };

  const toggleInList = (key: 'groupIds' | 'applicationIds', value: string) => {
    const exists = form[key].includes(value);
    setForm({
      ...form,
      [key]: exists ? form[key].filter((id) => id !== value) : [...form[key], value],
    });
  };

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Users</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>Organization-scoped user administration</p>
        </div>
        <button
          onClick={() => { resetForm(); setOpenCreate(true); }}
          style={canCreate ? btnPrimary : btnDisabled}
          disabled={!canCreate}
          title={!canCreate ? 'Read-only administrators cannot create users' : ''}
        >
          Create User
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users"
          style={inputStyle}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={inputStyle}>
          <option value="">All roles</option>
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <button onClick={() => { setPage(1); loadData(); }} style={btnSecondary}>Filter</button>
      </div>

      {error ? <div style={errorStyle}>{error}</div> : null}

      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Groups</th>
              <th style={thStyle}>Applications</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td style={tdStyle} colSpan={7}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td style={tdStyle} colSpan={7}>No users found</td></tr>
            ) : users.map((user) => (
              <tr key={user.id}>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}</td>
                <td style={tdStyle}><span style={badge}>{user.role}</span></td>
                <td style={tdStyle}>{user.groups?.map((g: any) => g.name).join(', ') || '-'}</td>
                <td style={tdStyle}>{user.applications?.map((a: any) => a.name).join(', ') || '-'}</td>
                <td style={tdStyle}>
                  {user.status}
                  {user.mustChangePassword ? <span style={mustChangeBadge}>PW Reset Required</span> : null}
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => openEdit(user)}
                    style={canUpdate ? linkBtn : btnDisabled}
                    disabled={!canUpdate}
                    title={!canUpdate ? 'Read-only administrators cannot edit users' : ''}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    style={canDelete ? dangerBtn : btnDisabled}
                    disabled={!canDelete}
                    title={!canDelete ? 'Read-only administrators cannot delete users' : ''}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={btnSecondary}>Previous</button>
        <div>Page {page} / {totalPages}</div>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={btnSecondary}>Next</button>
      </div>

      {(openCreate || editingUser) ? (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h2 style={{ margin: 0 }}>{editingUser ? 'Edit User' : 'Create User'}</h2>

            {!editingUser ? (
              <>
                <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                <div style={sectionCard}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>First-time Password Setup</div>
                  <label style={inlineLabel}>
                    <input
                      type="radio"
                      checked={form.onboardingMethod === 'MAGIC_LINK'}
                      onChange={() => setForm({ ...form, onboardingMethod: 'MAGIC_LINK', temporaryPassword: '' })}
                    />
                    <span style={{ marginLeft: 8 }}>Set by user (magic link)</span>
                  </label>
                  <label style={inlineLabel}>
                    <input
                      type="radio"
                      checked={form.onboardingMethod === 'TEMP_PASSWORD'}
                      onChange={() => setForm({ ...form, onboardingMethod: 'TEMP_PASSWORD' })}
                    />
                    <span style={{ marginLeft: 8 }}>Admin sets temporary password</span>
                  </label>
                  {form.onboardingMethod === 'TEMP_PASSWORD' ? (
                    <input
                      placeholder="Temporary password (min 8 characters)"
                      value={form.temporaryPassword}
                      onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })}
                      style={{ ...inputStyle, marginTop: 8 }}
                      type="password"
                    />
                  ) : null}
                </div>
              </>
            ) : null}

            <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={inputStyle} />
            <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={inputStyle} />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as OrgRole })} style={inputStyle}>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>

            <div style={sectionCard}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Groups</div>
              <div style={checkListStyle}>
                {groupOptions.map((group) => (
                  <label key={group.value} style={checkItemStyle}>
                    <input
                      type="checkbox"
                      checked={form.groupIds.includes(group.value)}
                      onChange={() => toggleInList('groupIds', group.value)}
                    />
                    <span style={{ marginLeft: 8 }}>{group.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={sectionCard}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Direct Application Assignment</div>
              <div style={checkListStyle}>
                {applicationOptions.map((app) => (
                  <label key={app.value} style={checkItemStyle}>
                    <input
                      type="checkbox"
                      checked={form.applicationIds.includes(app.value)}
                      onChange={() => toggleInList('applicationIds', app.value)}
                    />
                    <span style={{ marginLeft: 8 }}>{app.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => { setOpenCreate(false); resetForm(); }} style={btnSecondary}>Cancel</button>
              <button onClick={editingUser ? onUpdate : onCreate} style={btnPrimary}>{editingUser ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

const btnPrimary: React.CSSProperties = {
  background: 'var(--btn-primary-bg, #4f46e5)',
  color: 'var(--btn-primary-text, #fff)',
  border: 'none',
  borderRadius: 8,
  padding: '0.6rem 1rem',
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  background: 'var(--btn-secondary-bg, #fff)',
  color: 'var(--btn-secondary-text, #374151)',
  border: '1px solid var(--btn-secondary-border, #cbd5e1)',
  borderRadius: 8,
  padding: '0.55rem 0.9rem',
  cursor: 'pointer',
};

const dangerBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#ef4444',
  cursor: 'pointer',
  marginLeft: 10,
};

const linkBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--accent-primary, #6366f1)',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  padding: '0.55rem 0.7rem',
  border: '1px solid var(--border-input, #cbd5e1)',
  borderRadius: 8,
  width: '100%',
  background: 'var(--bg-input, #fff)',
  color: 'var(--text-primary)',
};

const tableWrap: React.CSSProperties = {
  border: '1px solid var(--border-color, #274267)',
  borderRadius: 12,
  overflow: 'hidden',
  background: 'var(--bg-card, #0f1d33)',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.8rem',
  borderBottom: '1px solid var(--border-color, #274267)',
  background: 'color-mix(in srgb, var(--bg-card, #0f1d33) 78%, #1b3f73 22%)',
  fontSize: '0.84rem',
  color: 'var(--text-secondary)',
};

const tdStyle: React.CSSProperties = {
  padding: '0.8rem',
  borderBottom: '1px solid var(--border-color, #274267)',
  fontSize: '0.9rem',
};

const badge: React.CSSProperties = {
  borderRadius: 999,
  padding: '0.2rem 0.6rem',
  background: 'rgba(59,130,246,0.2)',
  color: '#bfdbfe',
  fontSize: '0.72rem',
  fontWeight: 700,
};

const mustChangeBadge: React.CSSProperties = {
  marginLeft: 8,
  borderRadius: 999,
  padding: '0.15rem 0.5rem',
  fontSize: '0.68rem',
  background: 'rgba(245,158,11,0.22)',
  color: '#fbbf24',
  fontWeight: 700,
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(8, 17, 32, 0.65)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 200,
};

const modalCard: React.CSSProperties = {
  width: 'min(720px, 94vw)',
  maxHeight: '90vh',
  overflowY: 'auto',
  background: 'color-mix(in srgb, var(--bg-card, #0f1d33) 86%, #1a3760 14%)',
  border: '1px solid var(--border-color, #274267)',
  borderRadius: 12,
  padding: '1rem',
  display: 'grid',
  gap: '0.7rem',
};

const sectionCard: React.CSSProperties = {
  border: '1px solid var(--border-color, #274267)',
  background: 'color-mix(in srgb, var(--bg-card, #0f1d33) 82%, #1d3d69 18%)',
  borderRadius: 8,
  padding: '0.75rem',
};

const checkListStyle: React.CSSProperties = {
  maxHeight: 160,
  overflowY: 'auto',
  display: 'grid',
  gap: 4,
};

const checkItemStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.92rem',
  color: 'var(--text-primary)',
};

const inlineLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: 6,
  fontSize: '0.92rem',
};

const errorStyle: React.CSSProperties = {
  background: 'var(--error-bg, #fee2e2)',
  border: '1px solid var(--error-border, #fecaca)',
  color: 'var(--error-text, #991b1b)',
  padding: '0.6rem 0.8rem',
  borderRadius: 8,
  marginBottom: '0.8rem',
};

const btnDisabled: React.CSSProperties = {
  background: 'var(--btn-disabled-bg, #6b7280)',
  color: 'var(--btn-disabled-text, #9ca3af)',
  border: 'none',
  borderRadius: 8,
  padding: '0.6rem 1rem',
  cursor: 'not-allowed',
  opacity: 0.5,
};
