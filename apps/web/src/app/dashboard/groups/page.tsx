'use client';

import { useEffect, useMemo, useState } from 'react';
import { applicationApi, Application, groupsApi, usersApi } from '@/lib/api';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', description: '', userIds: [] as string[], applicationIds: [] as string[] });

  const applicationOptions = useMemo(
    () => applications.filter((app) => app.status !== 'ARCHIVED').map((app) => ({ id: app.id, name: app.name })),
    [applications],
  );

  useEffect(() => {
    setOrgId(localStorage.getItem('currentOrgId'));
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [groupResult, userResult, appResult] = await Promise.all([
        groupsApi.list({ search, page: 1, limit: 100 }),
        usersApi.list({ page: 1, limit: 500 }),
        orgId ? applicationApi.list(orgId) : Promise.resolve([] as Application[]),
      ]);
      setGroups(groupResult.groups);
      setUsers(userResult.users);
      setApplications(appResult);
    } catch (err: any) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orgId) return;
    loadData();
  }, [orgId]);

  const startCreate = () => {
    setEditingGroup(null);
    setForm({ name: '', description: '', userIds: [], applicationIds: [] });
    setOpenCreate(true);
  };

  const startEdit = (group: any) => {
    setEditingGroup(group);
    setOpenCreate(false);
    setForm({
      name: group.name,
      description: group.description || '',
      userIds: group.members?.map((m: any) => m.id) || [],
      applicationIds: group.applications?.map((a: any) => a.id) || [],
    });
  };

  const save = async () => {
    if (editingGroup) {
      await groupsApi.update(editingGroup.id, { name: form.name, description: form.description });
      await Promise.all([
        groupsApi.setUsers(editingGroup.id, form.userIds),
        groupsApi.setApplications(editingGroup.id, form.applicationIds),
      ]);
    } else {
      const created = await groupsApi.create({ name: form.name, description: form.description });
      await Promise.all([
        groupsApi.setUsers(created.id, form.userIds),
        groupsApi.setApplications(created.id, form.applicationIds),
      ]);
    }

    setOpenCreate(false);
    setEditingGroup(null);
    setForm({ name: '', description: '', userIds: [], applicationIds: [] });
    loadData();
  };

  const remove = async (groupId: string) => {
    if (!confirm('Delete this group?')) return;
    await groupsApi.remove(groupId);
    loadData();
  };

  const toggleValue = (key: 'userIds' | 'applicationIds', value: string) => {
    const exists = form[key].includes(value);
    setForm({
      ...form,
      [key]: exists ? form[key].filter((id) => id !== value) : [...form[key], value],
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Groups</h1>
          <p style={{ marginTop: 4, color: 'var(--text-secondary)' }}>Manage group membership and application access</p>
        </div>
        <button onClick={startCreate} style={btnPrimary}>Create Group</button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups" style={inputStyle} />
        <button onClick={loadData} style={btnSecondary}>Filter</button>
      </div>

      {error ? <div style={errorStyle}>{error}</div> : null}

      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Members</th>
              <th style={thStyle}>Applications</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={tdStyle}>Loading...</td></tr>
            ) : groups.length === 0 ? (
              <tr><td colSpan={5} style={tdStyle}>No groups found</td></tr>
            ) : groups.map((group) => (
              <tr key={group.id}>
                <td style={tdStyle}>{group.name}</td>
                <td style={tdStyle}>{group.description || '-'}</td>
                <td style={tdStyle}>{group.members?.map((m: any) => m.email).join(', ') || '-'}</td>
                <td style={tdStyle}>{group.applications?.map((a: any) => a.name).join(', ') || '-'}</td>
                <td style={tdStyle}>
                  <button onClick={() => startEdit(group)} style={linkBtn}>Edit</button>
                  <button onClick={() => remove(group.id)} style={dangerBtn}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(openCreate || editingGroup) ? (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h2 style={{ margin: 0 }}>{editingGroup ? 'Edit Group' : 'Create Group'}</h2>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Group name" style={inputStyle} />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" style={inputStyle} />

            <div style={sectionCard}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Members</div>
              <div style={checkListStyle}>
                {users.map((user) => (
                  <label key={user.id} style={checkItemStyle}>
                    <input
                      type="checkbox"
                      checked={form.userIds.includes(user.id)}
                      onChange={() => toggleValue('userIds', user.id)}
                    />
                    <span style={{ marginLeft: 8 }}>{user.email}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={sectionCard}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Application Assignments</div>
              <div style={checkListStyle}>
                {applicationOptions.map((app) => (
                  <label key={app.id} style={checkItemStyle}>
                    <input
                      type="checkbox"
                      checked={form.applicationIds.includes(app.id)}
                      onChange={() => toggleValue('applicationIds', app.id)}
                    />
                    <span style={{ marginLeft: 8 }}>{app.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => {
                  setOpenCreate(false);
                  setEditingGroup(null);
                  setForm({ name: '', description: '', userIds: [], applicationIds: [] });
                }}
                style={btnSecondary}
              >
                Cancel
              </button>
              <button onClick={save} style={btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
  border: '1px solid var(--border-color, #274267)',
  borderRadius: 8,
  maxHeight: 220,
  overflowY: 'auto',
  padding: '0.75rem',
  background: 'var(--bg-input, #132742)',
  display: 'grid',
  gap: 4,
};

const checkItemStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--text-primary)',
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
