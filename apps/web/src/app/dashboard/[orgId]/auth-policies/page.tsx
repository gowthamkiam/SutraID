'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { organizationSettingsApi, OrgRole } from '@/lib/api';
import { useOrg } from '@/components/providers/OrgContextProvider';
import { hasPermission } from '@/lib/permissions';
import {
    Shield,
    KeyRound,
    Lock,
    Clock,
    Smartphone,
    CheckCircle2,
    AlertCircle,
    Save,
    Zap,
    Globe,
    Fingerprint,
    Mail,
    MessageSquare
} from 'lucide-react';

export default function AuthPoliciesPage() {
    const params = useParams();
    const orgId = params.orgId as string;
    const { orgRole } = useOrg();
    const canEdit = hasPermission(orgRole as OrgRole, 'settings:update');

    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await organizationSettingsApi.getOrg();
                setSettings(data.settings || {});
            } catch (err: any) {
                console.error('Failed to load settings:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const updateSetting = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await organizationSettingsApi.updateOrg({ settings });
            setMessage({ type: 'success', text: 'Authentication policies updated successfully.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update policies.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--accent-light)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, letterSpacing: '-0.025em' }}>Sign-in Policy</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage how users authenticate and secure their sessions.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={!canEdit || saving}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: canEdit ? 'var(--btn-primary-bg)' : 'var(--btn-disabled-bg)',
                        color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px',
                        fontWeight: '600', cursor: canEdit ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                    }}
                >
                    {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>
            </header>

            {message && (
                <div style={{
                    padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '2rem',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    color: message.type === 'success' ? '#10b981' : '#ef4444',
                    display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gap: '2rem' }}>
                {/* MFA Section */}
                <section style={cardStyle}>
                    <div style={cardHeaderStyle}>
                        <Smartphone size={22} style={{ color: 'var(--accent-primary)' }} />
                        <h2 style={cardTitleStyle}>Multi-Factor Authentication (MFA)</h2>
                    </div>
                    <p style={cardDescStyle}>Require an additional layer of security during sign-in.</p>

                    <div style={formGridStyle}>
                        <div>
                            <label style={labelStyle}>MFA Enforcement</label>
                            <select
                                value={settings['security.mfa_required'] || 'false'}
                                onChange={(e) => updateSetting('security.mfa_required', e.target.value)}
                                style={selectStyle}
                                disabled={!canEdit}
                            >
                                <option value="false">Optional (User can choose)</option>
                                <option value="true">Required for all users</option>
                                <option value="admin_only">Required for admins only</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Adaptive MFA (Risk-based)</label>
                            <select
                                value={settings['security.adaptive_mfa'] || 'false'}
                                onChange={(e) => updateSetting('security.adaptive_mfa', e.target.value)}
                                style={selectStyle}
                                disabled={!canEdit}
                            >
                                <option value="false">Disabled</option>
                                <option value="true">Enabled (Challenges on suspicious IPs/locations)</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                            <label style={labelStyle}>Allowed MFA Methods</label>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <MethodToggle icon={Zap} label="TOTP (Authenticator App)" active />
                                <MethodToggle icon={Fingerprint} label="WebAuthn / Passkeys" active />
                                <MethodToggle icon={Mail} label="Email OTP" active />
                                <MethodToggle icon={MessageSquare} label="SMS OTP" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Password Policy Section */}
                <section style={cardStyle}>
                    <div style={cardHeaderStyle}>
                        <Lock size={22} style={{ color: 'var(--accent-primary)' }} />
                        <h2 style={cardTitleStyle}>Password Strength Policy</h2>
                    </div>
                    <p style={cardDescStyle}>Define the complexity requirements for user passwords.</p>

                    <div style={formGridStyle}>
                        <div>
                            <label style={labelStyle}>Minimum Password Length</label>
                            <select
                                value={settings['password.min_length'] || '8'}
                                onChange={(e) => updateSetting('password.min_length', e.target.value)}
                                style={selectStyle}
                                disabled={!canEdit}
                            >
                                <option value="8">8 Characters</option>
                                <option value="10">10 Characters</option>
                                <option value="12">12 Characters (Recommended)</option>
                                <option value="16">16 Characters</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Complexity Requirements</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                <Checkbox label="Require Uppercase" checked />
                                <Checkbox label="Require Numbers" checked />
                                <Checkbox label="Require Special Characters" checked />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Session Section */}
                <section style={cardStyle}>
                    <div style={cardHeaderStyle}>
                        <Clock size={22} style={{ color: 'var(--accent-primary)' }} />
                        <h2 style={cardTitleStyle}>Session and Lockout</h2>
                    </div>
                    <p style={cardDescStyle}>Control how long sessions last and when users get locked out.</p>

                    <div style={formGridStyle}>
                        <div>
                            <label style={labelStyle}>Session Timeout (idle)</label>
                            <select
                                value={settings['security.session_timeout_minutes'] || '60'}
                                onChange={(e) => updateSetting('security.session_timeout_minutes', e.target.value)}
                                style={selectStyle}
                                disabled={!canEdit}
                            >
                                <option value="15">15 Minutes</option>
                                <option value="30">30 Minutes</option>
                                <option value="60">1 Hour</option>
                                <option value="480">8 Hours</option>
                                <option value="1440">24 Hours</option>
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Brute Force Lockout</label>
                            <select
                                value={settings['security.lockout_attempts'] || '5'}
                                onChange={(e) => updateSetting('security.lockout_attempts', e.target.value)}
                                style={selectStyle}
                                disabled={!canEdit}
                            >
                                <option value="3">3 Failed Attempts</option>
                                <option value="5">5 Failed Attempts</option>
                                <option value="10">10 Failed Attempts</option>
                                <option value="0">Disabled</option>
                            </select>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function MethodToggle({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
            borderRadius: '8px', border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-color)'}`,
            background: active ? 'var(--accent-light)' : 'transparent',
            color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
            fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer'
        }}>
            <Icon size={16} />
            {label}
            {active && <CheckCircle2 size={14} style={{ marginLeft: '4px' }} />}
        </div>
    );
}

function Checkbox({ label, checked }: { label: string, checked?: boolean }) {
    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={checked} readOnly style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }} />
            {label}
        </label>
    );
}

const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: 'var(--shadow-sm)',
};

const cardHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '0.5rem',
};

const cardTitleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: '700',
    margin: 0,
};

const cardDescStyle: React.CSSProperties = {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    marginBottom: '2rem',
};

const formGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: 'var(--text-primary)',
};

const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-input)',
    borderRadius: '10px',
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    outline: 'none',
};
