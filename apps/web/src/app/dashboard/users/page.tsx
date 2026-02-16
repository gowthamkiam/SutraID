'use client';

import { useEffect, useMemo, useState } from 'react';
import { OrgRole, groupsApi, usersApi } from '@/lib/api';

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

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
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
  });

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResult, groupsResult] = await Promise.all([
        usersApi.list({ search, role: (roleFilter || undefined) as OrgRole | undefined, page, limit: 10 }),
        groupsApi.list({ page: 1, limit: 200 }),
      ]);
      setUsers(usersResult.users);
      setTotalPages(usersResult.totalPages || 1);
      setGroups(groupsResult.groups);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const groupOptions = useMemo(() => groups.map((g) => ({ value: g.id, label: g.name })), [groups]);

  const resetForm = () => {
    setForm({ email: '', firstName: '', lastName: '', role: 'READ_ONLY_ADMIN', groupIds: [] });
    setEditingUser(null);
  };

  const onCreate = async () => {
    await usersApi.create(form);
    setOpenCreate(false);
    resetForm();
    loadData();
  };

  const onUpdate = async () => {
    if (!editingUser) return;
    await usersApi.update(editingUser.id, {
      firstName: form.firstName,
      lastName: form.lastName,
      role: form.role,
      groupIds: form.groupIds,
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
    setForm({
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      groupIds: user.groups?.map((g: any) => g.id) || [],
    });
  };

  return (
    <div>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Users</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>Organization-scoped user administration</p>
        </div>
        <button onClick={() => setOpenCreate(true)} style={btnPrimary}>Create User</button>
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
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td style={tdStyle} colSpan={6}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td style={tdStyle} colSpan={6}>No users found</td></tr>
            ) : users.map((user) => (
              <tr key={user.id}>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{[user.firstName, user.lastName].filter(Boolean).join(' ') || '-'}</td>
                <td style={tdStyle}><span style={badge}>{user.role}</span></td>
                <td style={tdStyle}>{user.groups?.map((g: any) => g.name).join(', ') || '-'}</td>
                <td style={tdStyle}>{user.status}</td>
                <td style={tdStyle}>
                  <button onClick={() => openEdit(user)} style={linkBtn}>Edit</button>
                  <button onClick={() => onDelete(user.id)} style={dangerBtn}>Delete</button>
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
            <h2>{editingUser ? 'Edit User' : 'Create User'}</h2>
            {!editingUser ? (
              <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            ) : null}
            <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} style={inputStyle} />
            <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={inputStyle} />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as OrgRole })} style={inputStyle}>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem', maxHeight: 160, overflowY: 'auto' }}>
              {groupOptions.map((group) => {
                const checked = form.groupIds.includes(group.value);
                return (
                  <label key={group.value} style={{ display: 'block', marginBottom: 6 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setForm({
                          ...form,
                          groupIds: checked
                            ? form.groupIds.filter((id) => id !== group.value)
                            : [...form.groupIds, group.value],
                        });
                      }}
                    />
                    <span style={{ marginLeft: 8 }}>{group.label}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={() => { setOpenCreate(false); resetForm(); }} style={btnSecondary}>Cancel</button>
              <button onClick={editingUser ? onUpdate : onCreate} style={btnPrimary}>{editingUser ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: '#1d4ed8',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '0.6rem 1rem',
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: '0.55rem 0.9rem',
  cursor: 'pointer',
};

const dangerBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#dc2626',
  cursor: 'pointer',
  marginLeft: 10,
};

const linkBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#1d4ed8',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  padding: '0.55rem 0.7rem',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  width: '100%',
};

const tableWrap: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  overflow: 'hidden',
  background: '#fff',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.8rem',
  borderBottom: '1px solid #e2e8f0',
  background: '#f8fafc',
  fontSize: '0.84rem',
};

const tdStyle: React.CSSProperties = {
  padding: '0.8rem',
  borderBottom: '1px solid #f1f5f9',
  fontSize: '0.9rem',
};

const badge: React.CSSProperties = {
  borderRadius: 999,
  padding: '0.2rem 0.6rem',
  background: '#dbeafe',
  color: '#1e40af',
  fontSize: '0.72rem',
  fontWeight: 700,
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15,23,42,0.45)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 200,
};

const modalCard: React.CSSProperties = {
  width: 'min(560px, 92vw)',
  background: '#fff',
  borderRadius: 12,
  padding: '1rem',
  display: 'grid',
  gap: '0.7rem',
};

const errorStyle: React.CSSProperties = {
  background: '#fee2e2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  padding: '0.6rem 0.8rem',
  borderRadius: 8,
  marginBottom: '0.8rem',
};
