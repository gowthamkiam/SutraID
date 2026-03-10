'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';
import { OrgRole, OrganizationProfile, organizationSettingsApi, mfaApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { hasPermission } from '@/lib/permissions';

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
  const { role: orgRole } = useAuth();
  const canEdit = hasPermission(orgRole as OrgRole, 'settings:update');
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = (searchParams.get('tab') as TabKey) || 'organization_info';
  const validTab = tabs.some((t) => t.key === initialTab) ? initialTab : 'organization_info';
  const mfaSetupRequired = searchParams.get('mfa_setup') === 'required';

  const [org, setOrg] = useState<OrganizationProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>(validTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) setPasskeyAvailable(true);
  }, []);

  // MFA enrollment modal state
  const [showMfaModal, setShowMfaModal] = useState(mfaSetupRequired);
  const [mfaStep, setMfaStep] = useState<'prompt' | 'qr' | 'verify' | 'done' | 'passkey-registering' | 'passkey-done'>('prompt');
  const [mfaMethodId, setMfaMethodId] = useState('');
  const [mfaQr, setMfaQr] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  const startTotpEnrollment = async () => {
    setMfaLoading(true);
    setMfaError('');
    try {
      const data = await mfaApi.enrollTotp();
      setMfaMethodId(data.methodId);
      setMfaQr(data.qrCodeDataUrl);
      setMfaSecret(data.secret);
      setMfaBackupCodes(data.backupCodes);
      setMfaStep('qr');
    } catch (err: any) {
      setMfaError(err.message || 'Failed to start MFA setup');
    } finally {
      setMfaLoading(false);
    }
  };

  const verifyTotpEnrollment = async () => {
    if (mfaCode.length !== 6) return;
    setMfaLoading(true);
    setMfaError('');
    try {
      await mfaApi.verifyEnrollment(mfaMethodId, mfaCode);
      setMfaStep('done');
    } catch (err: any) {
      setMfaError(err.message || 'Invalid code. Try again.');
    } finally {
      setMfaLoading(false);
    }
  };

  const enrollPasskey = async () => {
    setMfaLoading(true);
    setMfaError('');
    setMfaStep('passkey-registering');
    try {
      const options = await mfaApi.getPasskeyOptions();
      const credential = await startRegistration({ optionsJSON: options });
      await mfaApi.enrollPasskey(credential);
      setMfaStep('passkey-done');
    } catch (err: any) {
      setMfaError(err.message || 'Passkey registration failed');
      setMfaStep('prompt');
    } finally {
      setMfaLoading(false);
    }
  };

  const dismissMfaModal = () => {
    setShowMfaModal(false);
    router.replace('/dashboard/settings?tab=security');
  };

  const [orgName, setOrgName] = useState('');
  const [settings, setSettings] = useState<Record<string, string>>({});

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
    if (!canEdit) {
      setError('You do not have permission to update organization settings.');
      return;
    }
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
      {showMfaModal ? (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: '2rem',
            width: '100%',
            maxWidth: 440,
            display: 'grid',
            gap: '1rem',
          }}>
            {mfaStep === 'prompt' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🔐</span>
                  <h2 style={{ margin: 0, fontSize: '1.2rem' }}>MFA Setup Required</h2>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Your organization requires multi-factor authentication. Choose a method to continue.
                </p>
                {mfaError ? <div style={errorStyle}>{mfaError}</div> : null}
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  <button
                    onClick={startTotpEnrollment}
                    disabled={mfaLoading}
                    style={{ ...btnPrimary, textAlign: 'left', padding: '0.75rem 1rem' }}
                  >
                    <div style={{ fontWeight: 700 }}>Authenticator App</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 400 }}>Google Authenticator, Authy, 1Password</div>
                  </button>
                  {passkeyAvailable ? (
                    <button
                      onClick={enrollPasskey}
                      disabled={mfaLoading}
                      style={{ ...btnSecondary, textAlign: 'left', padding: '0.75rem 1rem' }}
                    >
                      <div style={{ fontWeight: 700 }}>Passkey / Security Key</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 400 }}>Face ID, Touch ID, hardware key</div>
                    </button>
                  ) : null}
                </div>
              </>
            ) : mfaStep === 'passkey-registering' ? (
              <>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Register Passkey</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Follow your browser or device prompt to register your passkey...
                </p>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Working...</div>
              </>
            ) : mfaStep === 'passkey-done' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>✅</span>
                  <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Passkey Registered</h2>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Your passkey has been registered. You can now sign in with it.
                </p>
                <button onClick={dismissMfaModal} style={{ ...btnPrimary, justifySelf: 'start' }}>
                  Continue
                </button>
              </>
            ) : mfaStep === 'qr' ? (
              <>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Scan QR Code</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Scan with Google Authenticator, Authy, or any TOTP app.
                </p>
                {mfaQr ? (
                  <img src={mfaQr} alt="QR Code" style={{ width: 200, height: 200, justifySelf: 'center', borderRadius: 8 }} />
                ) : null}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                  Manual key: <strong style={{ color: 'var(--text-primary)' }}>{mfaSecret}</strong>
                </div>
                <button onClick={() => setMfaStep('verify')} style={{ ...btnPrimary, justifySelf: 'start' }}>
                  Next: Enter Code
                </button>
              </>
            ) : mfaStep === 'verify' ? (
              <>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Verify Code</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Enter the 6-digit code from your authenticator app.
                </p>
                {mfaError ? <div style={errorStyle}>{mfaError}</div> : null}
                <input
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  style={{ ...inputStyle, fontSize: '1.4rem', letterSpacing: '0.3em', textAlign: 'center' }}
                  onKeyDown={(e) => e.key === 'Enter' && verifyTotpEnrollment()}
                  autoFocus
                />
                <button
                  onClick={verifyTotpEnrollment}
                  disabled={mfaLoading || mfaCode.length !== 6}
                  style={mfaCode.length === 6 ? { ...btnPrimary, justifySelf: 'start' } : { ...btnDisabled, justifySelf: 'start' }}
                >
                  {mfaLoading ? 'Verifying...' : 'Verify & Enable MFA'}
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>✅</span>
                  <h2 style={{ margin: 0, fontSize: '1.2rem' }}>MFA Enabled</h2>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Your account is now protected with multi-factor authentication.
                </p>
                {mfaBackupCodes.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Save these backup codes in a safe place:
                    </div>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem',
                      background: 'var(--bg-input)', borderRadius: 8, padding: '0.75rem',
                      border: '1px solid var(--border-input)',
                    }}>
                      {mfaBackupCodes.map((code) => (
                        <span key={code} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{code}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <button onClick={dismissMfaModal} style={{ ...btnPrimary, justifySelf: 'start' }}>
                  Continue
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
      <header
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 14,
          padding: '1rem 1.2rem',
          background: 'var(--bg-card)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.7rem' }}>Settings</h1>
          <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Enterprise company settings</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={save} disabled={!canEdit || saving} style={canEdit ? btnPrimary : btnDisabled} title={!canEdit ? 'You do not have permission to update organization settings' : ''}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {error ? <div style={errorStyle}>{error}</div> : null}
      {message ? <div style={successStyle}>{message}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1rem' }}>
        <aside style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '0.5rem' }}>
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
                background: activeTab === tab.key ? 'color-mix(in srgb, var(--accent-primary) 24%, var(--bg-card))' : 'transparent',
                color: activeTab === tab.key ? '#bfdbfe' : 'var(--text-primary)',
                fontWeight: 600,
                padding: '0.65rem 0.7rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.1rem' }}>
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

const btnSecondary: React.CSSProperties = {
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  borderRadius: 10,
  padding: '0.55rem 1rem',
  cursor: 'pointer',
};

const btnPrimary: React.CSSProperties = {
  background: 'var(--btn-primary-bg)',
  color: 'var(--btn-primary-text)',
  border: 'none',
  borderRadius: 10,
  padding: '0.55rem 1rem',
  cursor: 'pointer',
};

const btnDisabled: React.CSSProperties = {
  background: 'var(--btn-disabled-bg, #6b7280)',
  color: 'var(--btn-disabled-text, #9ca3af)',
  border: 'none',
  borderRadius: 10,
  padding: '0.55rem 1rem',
  cursor: 'not-allowed',
  opacity: 0.5,
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
  color: 'var(--text-secondary)',
};

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--border-input)',
  borderRadius: 8,
  padding: '0.55rem 0.7rem',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
};

const errorStyle: React.CSSProperties = {
  background: 'var(--error-bg)',
  border: '1px solid var(--error-border)',
  color: 'var(--error-text)',
  padding: '0.55rem 0.75rem',
  borderRadius: 8,
};

const successStyle: React.CSSProperties = {
  background: 'var(--success-bg)',
  border: '1px solid var(--success-border)',
  color: 'var(--success-text)',
  padding: '0.55rem 0.75rem',
  borderRadius: 8,
};
