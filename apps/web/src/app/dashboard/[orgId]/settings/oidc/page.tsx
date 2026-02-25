'use client';

import React, { useState, useEffect } from 'react';
import {
    Shield,
    Plus,
    Trash2,
    Save,
    Info,
    ChevronRight,
    Key,
    Clock,
    Variable,
    Settings2,
    AlertCircle,
    Database,
    RefreshCw,
    Search,
    CheckCircle2
} from 'lucide-react';
import { oidcConfigApi, applicationApi, Application, OidcScope, OidcClaim, OidcRegexRule, OidcSigningKey, OidcTokenPolicy } from '@/lib/api';
import { useOrg } from '@/components/providers/OrgContextProvider';

export default function OidcSettingsPage() {
    const { orgId } = useOrg();
    const [activeTab, setActiveTab] = useState<'scopes' | 'claims' | 'security' | 'keys' | 'regex'>('scopes');
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<any>(null);
    const [oidcApps, setOidcApps] = useState<Application[]>([]);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

    useEffect(() => {
        if (orgId) {
            loadInitialData(orgId);
        }
    }, [orgId]);

    const loadInitialData = async (targetOrgId: string) => {
        try {
            setLoading(true);
            const apps = await applicationApi.list(targetOrgId);
            const filteredOidcApps = apps.filter(app => app.type === 'OIDC');
            setOidcApps(filteredOidcApps);

            if (filteredOidcApps.length > 0) {
                const appId = filteredOidcApps[0].id;
                setSelectedAppId(appId);
                await loadConfig(targetOrgId, appId);
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error('Failed to load OIDC applications', err);
            setLoading(false);
        }
    };

    const loadConfig = async (targetOrgId: string, appId: string) => {
        try {
            setLoading(true);
            const data = await oidcConfigApi.getConfig(targetOrgId, appId);
            setConfig(data);
        } catch (err) {
            console.error('Failed to load OIDC config', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading configuration...</div>;
    }

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'white'
                        }}>
                            <Shield size={24} />
                        </div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>OIDC Configuration</h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        Manage custom scopes, claims, and security policies for your OIDC identity provider.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => {
                        if (selectedAppId) {
                            const discoveryUrl = applicationApi.getOidcDiscoveryUrl(orgId!, selectedAppId);
                            window.open(discoveryUrl, '_blank');
                        }
                    }} disabled={!selectedAppId} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 16px', borderRadius: '10px',
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)', cursor: selectedAppId ? 'pointer' : 'not-allowed',
                        fontWeight: 600, opacity: selectedAppId ? 1 : 0.5
                    }}>
                        <Database size={18} />
                        Discovery Docs
                    </button>
                </div>
            </header>

            <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '24px',
                background: 'var(--bg-badge)',
                padding: '4px',
                borderRadius: '12px',
                width: 'fit-content'
            }}>
                {[
                    { id: 'scopes', label: 'Scopes', icon: Search },
                    { id: 'claims', label: 'Claims', icon: Variable },
                    { id: 'regex', label: 'Regex Rules', icon: Settings2 },
                    { id: 'security', label: 'Token Policy', icon: Clock },
                    { id: 'keys', label: 'Signing Keys', icon: Key },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: active ? 'var(--bg-card)' : 'transparent',
                                color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: active ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {oidcApps.length > 0 && (
                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Configure Application:</label>
                    <select
                        value={selectedAppId || ''}
                        onChange={(e) => {
                            const appId = e.target.value;
                            setSelectedAppId(appId);
                            if (orgId) loadConfig(orgId, appId);
                        }}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            minWidth: '240px'
                        }}
                    >
                        {oidcApps.map(app => (
                            <option key={app.id} value={app.id}>{app.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {!loading && oidcApps.length === 0 && (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '24px'
                }}>
                    <AlertCircle size={48} color="var(--error-text)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>No OIDC Applications Found</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                        To configure OIDC settings, you must first create an OIDC application in your dashboard.
                    </p>
                </div>
            )}

            <main style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                padding: '32px',
                boxShadow: 'var(--shadow-card)',
                opacity: selectedAppId ? 1 : 0.5,
                pointerEvents: selectedAppId ? 'auto' : 'none'
            }}>
                {activeTab === 'scopes' && <ScopesTab scopes={config?.scopes || []} orgId={orgId!} appId={selectedAppId!} onRefresh={() => loadConfig(orgId!, selectedAppId!)} />}
                {activeTab === 'claims' && <ClaimsTab claims={config?.claims || []} regexRules={config?.regexRules || []} orgId={orgId!} appId={selectedAppId!} onRefresh={() => loadConfig(orgId!, selectedAppId!)} />}
                {activeTab === 'regex' && <RegexRulesTab rules={config?.regexRules || []} orgId={orgId!} appId={selectedAppId!} onRefresh={() => loadConfig(orgId!, selectedAppId!)} />}
                {activeTab === 'security' && <SecurityTab policy={config?.tokenPolicy} orgId={orgId!} appId={selectedAppId!} onRefresh={() => loadConfig(orgId!, selectedAppId!)} />}
                {activeTab === 'keys' && <KeysTab keys={config?.signingKeys || []} orgId={orgId!} appId={selectedAppId!} onRefresh={() => loadConfig(orgId!, selectedAppId!)} />}
            </main>
        </div>
    );
}

function ScopesTab({ scopes, orgId, appId, onRefresh }: { scopes: OidcScope[], orgId: string, appId: string, onRefresh: () => void }) {
    const [newScope, setNewScope] = useState({ name: '', description: '', isDefault: false });

    const handleAdd = async () => {
        if (!newScope.name) return;
        await oidcConfigApi.createScope(orgId, appId, newScope);
        setNewScope({ name: '', description: '', isDefault: false });
        onRefresh();
    };

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Custom Scopes</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        placeholder="scope-name"
                        value={newScope.name}
                        onChange={e => setNewScope({ ...newScope, name: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                    <button onClick={handleAdd} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', borderRadius: '8px',
                        background: 'var(--btn-primary-bg)', color: 'white',
                        border: 'none', cursor: 'pointer', fontWeight: 600
                    }}>
                        <Plus size={18} /> Add Scope
                    </button>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px 0' }}>Name</th>
                        <th>Description</th>
                        <th>Default</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {scopes.map(scope => (
                        <tr key={scope.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '16px 0', fontWeight: 600 }}>{scope.name}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{scope.description || '-'}</td>
                            <td>{scope.isDefault ? <CheckCircle2 size={18} color="var(--success-text)" /> : '-'}</td>
                            <td style={{ textAlign: 'right' }}>
                                <button style={{ background: 'transparent', border: 'none', color: 'var(--error-text)', cursor: 'pointer' }}>
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {scopes.length === 0 && (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                                No custom scopes defined yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function ClaimsTab({ claims, regexRules, orgId, appId, onRefresh }: { claims: OidcClaim[], regexRules: OidcRegexRule[], orgId: string, appId: string, onRefresh: () => void }) {
    const [showNewClaim, setShowNewClaim] = useState(false);
    const [newClaim, setNewClaim] = useState({ name: '', userAttribute: '', targetTokens: ['ID_TOKEN' as const] });

    const handleAddClaim = async () => {
        if (!newClaim.name || !newClaim.userAttribute) return;
        await oidcConfigApi.createClaim(orgId, appId, newClaim);
        setNewClaim({ name: '', userAttribute: '', targetTokens: ['ID_TOKEN'] });
        setShowNewClaim(false);
        onRefresh();
    };

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Claim Mappings</h2>
                <button onClick={() => setShowNewClaim(!showNewClaim)} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '8px',
                    background: 'var(--btn-primary-bg)', color: 'white',
                    border: 'none', cursor: 'pointer', fontWeight: 600
                }}>
                    <Plus size={18} /> {showNewClaim ? 'Cancel' : 'New Claim'}
                </button>
            </div>

            {showNewClaim && (
                <div style={{
                    marginBottom: '24px', padding: '20px', borderRadius: '12px',
                    background: 'var(--bg-badge)', border: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                            placeholder="Claim name (e.g., given_name, family_name)"
                            value={newClaim.name}
                            onChange={e => setNewClaim({ ...newClaim, name: e.target.value })}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                        <input
                            placeholder="User attribute (e.g., firstName, email)"
                            value={newClaim.userAttribute}
                            onChange={e => setNewClaim({ ...newClaim, userAttribute: e.target.value })}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                        <button onClick={handleAddClaim} disabled={!newClaim.name || !newClaim.userAttribute} style={{
                            padding: '10px', borderRadius: '8px',
                            background: (!newClaim.name || !newClaim.userAttribute) ? '#4b5563' : 'var(--btn-primary-bg)',
                            color: 'white', border: 'none',
                            cursor: (!newClaim.name || !newClaim.userAttribute) ? 'not-allowed' : 'pointer',
                            fontWeight: 600
                        }}>
                            Create Claim
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                {claims.map(claim => (
                    <div key={claim.id} style={{
                        padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-badge)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{claim.name}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {claim.targetTokens.map(t => (
                                    <span key={t} style={{
                                        fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px',
                                        background: 'var(--accent-primary)', color: 'white', fontWeight: 700
                                    }}>{t.replace('_TOKEN', '')}</span>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <Database size={14} />
                            <span>Maps from: <code>{claim.userAttribute}</code></span>
                        </div>
                        {claim.regexRule && (
                            <div style={{ marginTop: '12px', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.03)', fontSize: '0.85rem' }}>
                                <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <RefreshCw size={12} /> Transform: {claim.regexRule.name}
                                </div>
                                <code>/{claim.regexRule.pattern}/{claim.regexRule.flags}</code>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function SecurityTab({ policy, orgId, appId, onRefresh }: { policy: OidcTokenPolicy, orgId: string, appId: string, onRefresh: () => void }) {
    const [formData, setFormData] = useState(policy || {});

    const handleSave = async () => {
        await oidcConfigApi.updateTokenPolicy(orgId, appId, formData);
        onRefresh();
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Token Policies</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 600 }}>Access Token Lifetime (seconds)</label>
                    <input
                        type="number"
                        value={formData.accessTokenLifetime}
                        onChange={e => setFormData({ ...formData, accessTokenLifetime: parseInt(e.target.value) })}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 600 }}>ID Token Lifetime (seconds)</label>
                    <input
                        type="number"
                        value={formData.idTokenLifetime}
                        onChange={e => setFormData({ ...formData, idTokenLifetime: parseInt(e.target.value) })}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 600 }}>Refresh Token Rotation</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                            type="checkbox"
                            checked={formData.rotationEnabled}
                            onChange={e => setFormData({ ...formData, rotationEnabled: e.target.checked })}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <span>Enable Token Rotation (OAuth 2.1 compliance)</span>
                    </div>
                </div>

                <button onClick={handleSave} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                    padding: '12px', borderRadius: '8px',
                    background: 'var(--btn-primary-bg)', color: 'white',
                    border: 'none', cursor: 'pointer', fontWeight: 700, marginTop: '12px'
                }}>
                    <Save size={18} /> Save Policy
                </button>
            </div>
        </div>
    );
}

function KeysTab({ keys, orgId, appId, onRefresh }: { keys: OidcSigningKey[], orgId: string, appId: string, onRefresh: () => void }) {
    const [showUpload, setShowUpload] = useState(false);
    const [newKey, setNewKey] = useState({ kid: '', algorithm: 'RS256' as const, publicKey: '' });

    const handleUploadKey = async () => {
        if (!newKey.kid || !newKey.publicKey) return;
        await oidcConfigApi.createSigningKey(orgId, appId, newKey);
        setNewKey({ kid: '', algorithm: 'RS256', publicKey: '' });
        setShowUpload(false);
        onRefresh();
    };

    return (
        <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Signing Keys (JWS)</h2>
                <button onClick={() => setShowUpload(!showUpload)} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '8px',
                    background: 'var(--btn-primary-bg)', color: 'white',
                    border: 'none', cursor: 'pointer', fontWeight: 600
                }}>
                    <Plus size={18} /> {showUpload ? 'Cancel' : 'Upload Key'}
                </button>
            </div>

            {showUpload && (
                <div style={{
                    marginBottom: '24px', padding: '20px', borderRadius: '12px',
                    background: 'var(--bg-badge)', border: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                            placeholder="Key ID (kid)"
                            value={newKey.kid}
                            onChange={e => setNewKey({ ...newKey, kid: e.target.value })}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                        <select
                            value={newKey.algorithm}
                            onChange={e => setNewKey({ ...newKey, algorithm: e.target.value as 'RS256' | 'ES256' })}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        >
                            <option value="RS256">RS256</option>
                            <option value="ES256">ES256</option>
                        </select>
                        <textarea
                            placeholder="Public Key (PEM format)"
                            value={newKey.publicKey}
                            onChange={e => setNewKey({ ...newKey, publicKey: e.target.value })}
                            rows={6}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.85rem' }}
                        />
                        <button onClick={handleUploadKey} disabled={!newKey.kid || !newKey.publicKey} style={{
                            padding: '10px', borderRadius: '8px',
                            background: (!newKey.kid || !newKey.publicKey) ? '#4b5563' : 'var(--btn-primary-bg)',
                            color: 'white', border: 'none',
                            cursor: (!newKey.kid || !newKey.publicKey) ? 'not-allowed' : 'pointer',
                            fontWeight: 600
                        }}>
                            Upload Key
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {keys.map(key => (
                    <div key={key.id} style={{
                        padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)',
                        background: 'var(--bg-badge)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                                display: 'grid', placeItems: 'center', color: 'var(--accent-primary)'
                            }}>
                                <Key size={24} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700 }}>{key.kid}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{key.algorithm} • Created {new Date(key.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {key.isDefault && <span style={{
                                fontSize: '0.7rem', padding: '4px 10px', borderRadius: '99px',
                                background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)',
                                fontWeight: 700
                            }}>DEFAULT</span>}
                            <button style={{ padding: '8px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RegexRulesTab({ rules, orgId, appId, onRefresh }: { rules: OidcRegexRule[], orgId: string, appId: string, onRefresh: () => void }) {
    const [newRule, setNewRule] = useState({ name: '', pattern: '', replacement: '', flags: 'g' });
    const [testInput, setTestInput] = useState('');
    const [testResult, setTestResult] = useState('');

    const handleAdd = async () => {
        if (!newRule.name || !newRule.pattern) return;
        await oidcConfigApi.createRegexRule(orgId, appId, newRule);
        setNewRule({ name: '', pattern: '', replacement: '', flags: 'g' });
        onRefresh();
    };

    const runTest = () => {
        try {
            const re = new RegExp(newRule.pattern, newRule.flags);
            setTestResult(testInput.replace(re, newRule.replacement));
        } catch (err: any) {
            setTestResult(`Error: ${err.message}`);
        }
    };

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div>
                    <h2 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Transformation Rules</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                        <input
                            placeholder="Rule Name (e.g., Extract Domain)"
                            value={newRule.name}
                            onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                placeholder="Regex Pattern (e.g., ^.*@(.*)$)"
                                value={newRule.pattern}
                                onChange={e => setNewRule({ ...newRule, pattern: e.target.value })}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'monospace' }}
                            />
                            <input
                                placeholder="Flags"
                                value={newRule.flags}
                                onChange={e => setNewRule({ ...newRule, flags: e.target.value })}
                                style={{ width: '60px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', textAlign: 'center' }}
                            />
                        </div>
                        <input
                            placeholder="Replacement Template (e.g., $1)"
                            value={newRule.replacement}
                            onChange={e => setNewRule({ ...newRule, replacement: e.target.value })}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'monospace' }}
                        />
                        <button onClick={handleAdd} style={{
                            padding: '12px', borderRadius: '8px',
                            background: 'var(--btn-primary-bg)', color: 'white',
                            border: 'none', cursor: 'pointer', fontWeight: 700
                        }}>
                            Save Rule
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {rules.map(rule => (
                            <div key={rule.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-badge)' }}>
                                <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                    {rule.name}
                                    <Trash2 size={16} color="var(--error-text)" style={{ cursor: 'pointer' }} />
                                </div>
                                <code style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/{rule.pattern}/{rule.flags} → {rule.replacement}</code>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ paddingLeft: '32px', borderLeft: '1px solid var(--border-color)' }}>
                    <h2 style={{ marginBottom: '24px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCw size={20} /> Regex Tester
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Test your regex pattern and replacement against a sample input.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Sample Input</label>
                            <textarea
                                value={testInput}
                                onChange={e => setTestInput(e.target.value)}
                                placeholder="Enter sample text..."
                                style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'monospace' }}
                            />
                        </div>
                        <button onClick={runTest} style={{
                            padding: '10px', borderRadius: '8px',
                            background: 'var(--bg-card)', border: '1px solid var(--accent-primary)',
                            color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600
                        }}>
                            Run Test
                        </button>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Result</label>
                            <div style={{
                                minHeight: '40px', padding: '10px', borderRadius: '8px',
                                background: 'var(--accent-light)', color: 'var(--accent-text)',
                                border: '1px solid var(--accent-text)', fontFamily: 'monospace',
                                wordBreak: 'break-all'
                            }}>
                                {testResult || '(No result yet)'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
