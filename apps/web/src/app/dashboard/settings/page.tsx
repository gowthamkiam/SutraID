'use client';

import { useEffect, useMemo, useState } from 'react';
import { OrgRole, OrganizationProfile, organizationSettingsApi } from '@/lib/api';

const tabs = [
  { key: 'organization_info', label: 'Organization Info' },
  { key: 'security', label: 'Security' },
  { key: 'branding', label: 'Branding' },
  { key: 'access_policies', label: 'Access Policies' },
  { key: 'api_configuration', label: 'API Configuration' },
  { key: 'audit_logs', label: 'Audit Logs' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

export default function SettingsPage() {
  const [org, setOrg] = useState<OrganizationProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('organization_info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [orgName, setOrgName] = useState('');
  const [settings, setSettings] = useState<Record<string, string>>({});

  const role = useMemo(() => {
    if (typeof window === 'undefined') return 'READ_ONLY_ADMIN' as OrgRole;
    const userRaw = localStorage.getItem('user');
    if (!userRaw) return 'READ_ONLY_ADMIN' as OrgRole;
    try {
      return (JSON.parse(userRaw).role || 'READ_ONLY_ADMIN') as OrgRole;
    } catch {
      return 'READ_ONLY_ADMIN' as OrgRole;
    }
  }, []);

  const canEdit = role !== 'READ_ONLY_ADMIN';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await organizationSettingsApi.getOrg();
        setOrg(data);
        setOrgName(data.name);
        setSettings(data.settings || {});
      } catch (err: any) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await organizationSettingsApi.updateOrg({
        name: orgName,
        settings,
      });
      setOrg(updated);
      setSettings(updated.settings || {});
      setMessage('Organization settings saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <header
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          padding: '1rem 1.2rem',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.7rem' }}>Settings</h1>
          <div style={{ color: '#64748b', marginTop: 4 }}>Enterprise company settings</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {role === 'SUPER_ADMIN' ? <span style={superAdminBadge}>SUPER ADMIN</span> : null}
          <button onClick={save} disabled={!canEdit || saving} style={btnPrimary}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {error ? <div style={errorStyle}>{error}</div> : null}
      {message ? <div style={successStyle}>{message}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1rem' }}>
        <aside style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '0.5rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                width: '100%',
                textAlign: 'left',
                border: 'none',
                borderRadius: 10,
                marginBottom: 4,
                background: activeTab === tab.key ? '#dbeafe' : 'transparent',
                color: activeTab === tab.key ? '#1d4ed8' : '#0f172a',
                fontWeight: 600,
                padding: '0.65rem 0.7rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.1rem' }}>
          {activeTab === 'organization_info' ? (
            <div style={sectionGrid}>
              <h2 style={h2}>Organization Info</h2>
              <label style={label}>Organization Name</label>
              <input disabled={!canEdit} value={orgName} onChange={(e) => setOrgName(e.target.value)} style={inputStyle} />
              <label style={label}>Organization ID</label>
              <input disabled value={org?.id || ''} style={inputStyle} />
              <label style={label}>Slug</label>
              <input disabled value={org?.slug || ''} style={inputStyle} />
            </div>
          ) : null}

          {activeTab === 'security' ? (
            <div style={sectionGrid}>
              <h2 style={h2}>Security</h2>
              <label style={label}>Session Timeout (minutes)</label>
              <input
                disabled={!canEdit}
                value={settings['security.session_timeout_minutes'] || '30'}
                onChange={(e) => updateSetting('security.session_timeout_minutes', e.target.value)}
                style={inputStyle}
              />
              <label style={label}>MFA Required</label>
              <select
                disabled={!canEdit}
                value={settings['security.mfa_required'] || 'true'}
                onChange={(e) => updateSetting('security.mfa_required', e.target.value)}
                style={inputStyle}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          ) : null}

          {activeTab === 'branding' ? (
            <div style={sectionGrid}>
              <h2 style={h2}>Branding</h2>
              <label style={label}>Primary Color</label>
              <input
                disabled={!canEdit}
                value={settings['branding.primary_color'] || '#1d4ed8'}
                onChange={(e) => updateSetting('branding.primary_color', e.target.value)}
                style={inputStyle}
              />
              <label style={label}>Logo URL</label>
              <input
                disabled={!canEdit}
                value={settings['branding.logo_url'] || ''}
                onChange={(e) => updateSetting('branding.logo_url', e.target.value)}
                style={inputStyle}
              />
            </div>
          ) : null}

          {activeTab === 'access_policies' ? (
            <div style={sectionGrid}>
              <h2 style={h2}>Access Policies</h2>
              <label style={label}>Default User Role</label>
              <select
                disabled={!canEdit}
                value={settings['access.default_role'] || 'READ_ONLY_ADMIN'}
                onChange={(e) => updateSetting('access.default_role', e.target.value)}
                style={inputStyle}
              >
                <option value="READ_ONLY_ADMIN">READ_ONLY_ADMIN</option>
                <option value="USER_ADMIN">USER_ADMIN</option>
                <option value="GROUP_MEMBERSHIP_ADMIN">GROUP_MEMBERSHIP_ADMIN</option>
              </select>
              <label style={label}>IP Allow List (comma-separated)</label>
              <input
                disabled={!canEdit}
                value={settings['access.ip_allow_list'] || ''}
                onChange={(e) => updateSetting('access.ip_allow_list', e.target.value)}
                style={inputStyle}
              />
            </div>
          ) : null}

          {activeTab === 'api_configuration' ? (
            <div style={sectionGrid}>
              <h2 style={h2}>API Configuration</h2>
              <label style={label}>Rate Limit (requests/min)</label>
              <input
                disabled={!canEdit}
                value={settings['api.rate_limit_per_minute'] || '120'}
                onChange={(e) => updateSetting('api.rate_limit_per_minute', e.target.value)}
                style={inputStyle}
              />
              <label style={label}>Webhook URL</label>
              <input
                disabled={!canEdit}
                value={settings['api.webhook_url'] || ''}
                onChange={(e) => updateSetting('api.webhook_url', e.target.value)}
                style={inputStyle}
              />
            </div>
          ) : null}

          {activeTab === 'audit_logs' ? (
            <div style={sectionGrid}>
              <h2 style={h2}>Audit Logs</h2>
              <label style={label}>Retention Days</label>
              <input
                disabled={!canEdit}
                value={settings['audit.retention_days'] || '90'}
                onChange={(e) => updateSetting('audit.retention_days', e.target.value)}
                style={inputStyle}
              />
              <label style={label}>Export Target</label>
              <input
                disabled={!canEdit}
                value={settings['audit.export_target'] || ''}
                onChange={(e) => updateSetting('audit.export_target', e.target.value)}
                style={inputStyle}
              />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: '#1d4ed8',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '0.55rem 1rem',
  cursor: 'pointer',
};

const superAdminBadge: React.CSSProperties = {
  background: '#dbeafe',
  color: '#1e40af',
  border: '1px solid #bfdbfe',
  fontWeight: 700,
  borderRadius: 999,
  padding: '0.25rem 0.7rem',
  fontSize: '0.72rem',
};

const sectionGrid: React.CSSProperties = {
  display: 'grid',
  gap: '0.7rem',
};

const h2: React.CSSProperties = {
  margin: 0,
  fontSize: '1.2rem',
};

const label: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#475569',
};

const inputStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
};

const errorStyle: React.CSSProperties = {
  background: '#fee2e2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  padding: '0.55rem 0.75rem',
  borderRadius: 8,
};

const successStyle: React.CSSProperties = {
  background: '#dcfce7',
  border: '1px solid #bbf7d0',
  color: '#166534',
  padding: '0.55rem 0.75rem',
  borderRadius: 8,
};
