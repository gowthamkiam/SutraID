'use client';

import { useEffect, useState } from 'react';
import { groupsApi, usersApi } from '@/lib/api';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', description: '', userIds: [] as string[] });

  const loadData = async () => {
    setLoading(true);
    const [groupResult, userResult] = await Promise.all([
      groupsApi.list({ search, page: 1, limit: 100 }),
      usersApi.list({ page: 1, limit: 500 }),
    ]);
    setGroups(groupResult.groups);
    setUsers(userResult.users);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const startCreate = () => {
    setEditingGroup(null);
    setForm({ name: '', description: '', userIds: [] });
    setOpenCreate(true);
  };

  const startEdit = (group: any) => {
    setEditingGroup(group);
    setForm({
      name: group.name,
      description: group.description || '',
      userIds: group.members?.map((m: any) => m.id) || [],
    });
  };

  const save = async () => {
    if (editingGroup) {
      await groupsApi.update(editingGroup.id, { name: form.name, description: form.description });
      await groupsApi.setUsers(editingGroup.id, form.userIds);
    } else {
      const created = await groupsApi.create({ name: form.name, description: form.description });
      if (form.userIds.length) {
        await groupsApi.setUsers(created.id, form.userIds);
      }
    }

    setOpenCreate(false);
    setEditingGroup(null);
    setForm({ name: '', description: '', userIds: [] });
    loadData();
  };

  const remove = async (groupId: string) => {
    if (!confirm('Delete this group?')) return;
    await groupsApi.remove(groupId);
    loadData();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Groups</h1>
          <p style={{ marginTop: 4, color: '#64748b' }}>Manage group membership in your organization</p>
        </div>
        <button onClick={startCreate} style={btnPrimary}>Create Group</button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups" style={inputStyle} />
        <button onClick={loadData} style={btnSecondary}>Filter</button>
      </div>

      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Members</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={tdStyle}>Loading...</td></tr>
            ) : groups.length === 0 ? (
              <tr><td colSpan={4} style={tdStyle}>No groups found</td></tr>
            ) : groups.map((group) => (
              <tr key={group.id}>
                <td style={tdStyle}>{group.name}</td>
                <td style={tdStyle}>{group.description || '-'}</td>
                <td style={tdStyle}>{group.members?.map((m: any) => m.email).join(', ') || '-'}</td>
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

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, maxHeight: 220, overflowY: 'auto', padding: '0.75rem' }}>
              {users.map((user) => {
                const checked = form.userIds.includes(user.id);
                return (
                  <label key={user.id} style={{ display: 'block', marginBottom: 6 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setForm({
                          ...form,
                          userIds: checked ? form.userIds.filter((id) => id !== user.id) : [...form.userIds, user.id],
                        });
                      }}
                    />
                    <span style={{ marginLeft: 8 }}>{user.email}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => {
                  setOpenCreate(false);
                  setEditingGroup(null);
                  setForm({ name: '', description: '', userIds: [] });
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
