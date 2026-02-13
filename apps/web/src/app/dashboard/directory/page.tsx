'use client';

import { useState, useEffect } from 'react';
import {
    Layers,
    Shield,
    RefreshCcw,
    Link as LinkIcon,
    Server,
    Copy,
    CheckCircle,
    AlertCircle,
    Info,
    ChevronRight,
    Search
} from 'lucide-react';

type DirectoryMode = 'SCIM' | 'LDAP';

export default function DirectoryPage() {
    const [mode, setMode] = useState<DirectoryMode>('SCIM');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [scimToken, setScimToken] = useState('');
    const [copied, setCopied] = useState(false);

    // Mock org ID for demonstration
    const orgId = "org_sutraid_enterprise_demo";
    const tenantUrl = `https://api.sutraid.com/scim/v2/${orgId}`;

    const handleGenerateToken = () => {
        setLoading(true);
        setTimeout(() => {
            setScimToken('st_live_' + Math.random().toString(36).substring(7).repeat(4));
            setLoading(false);
            setMessage('New SCIM 2.0 token generated successfully.');
        }, 1000);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const cardStyle: React.CSSProperties = {
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e5e7eb',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8fafc',
            padding: '4rem 2rem',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Layers size={24} />
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            Directory Integration
                        </h1>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px' }}>
                        Synchronize users and groups from your external identity source to SutraID for automated provisioning.
                    </p>
                </header>

                {/* Mode Selector */}
                <div style={{
                    display: 'flex',
                    background: '#fff',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    marginBottom: '2rem',
                    width: 'fit-content'
                }}>
                    <button
                        onClick={() => setMode('SCIM')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: mode === 'SCIM' ? '#6366f1' : 'transparent',
                            color: mode === 'SCIM' ? '#fff' : '#64748b',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        SCIM 2.0 (Modern)
                    </button>
                    <button
                        onClick={() => setMode('LDAP')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: mode === 'LDAP' ? '#6366f1' : 'transparent',
                            color: mode === 'LDAP' ? '#fff' : '#64748b',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        LDAP / Active Directory
                    </button>
                </div>

                {message && (
                    <div style={{
                        padding: '1rem 1.25rem',
                        background: '#f0fdf4',
                        border: '1px solid #dcfce7',
                        borderRadius: '12px',
                        color: '#166534',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.95rem',
                    }}>
                        <CheckCircle size={18} />
                        {message}
                    </div>
                )}

                {mode === 'SCIM' ? (
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                                    Inbound Provisioning (SCIM)
                                </h2>
                                <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
                                    Enable your IdP (Entra ID, Okta) to push users and groups to SutraID.
                                </p>
                            </div>
                            <div style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '99px',
                                background: '#e0e7ff',
                                color: '#4338ca',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase'
                            }}>
                                Recommended
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>
                                SCIM Base URL
                            </label>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                color: '#0f172a',
                                fontWeight: 500,
                                fontSize: '0.95rem'
                            }}>
                                <code style={{ flex: 1 }}>{tenantUrl}</code>
                                <button
                                    onClick={() => copyToClipboard(tenantUrl)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#6366f1',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 600
                                    }}
                                >
                                    <Copy size={16} /> Copy
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>
                                API Bearer Token
                            </label>
                            {scimToken ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: '#f8fafc',
                                    border: '1px solid #6366f1',
                                    borderRadius: '12px',
                                    color: '#0f172a',
                                    fontWeight: 500,
                                }}>
                                    <code style={{ flex: 1 }}>{scimToken}</code>
                                    <button
                                        onClick={() => copyToClipboard(scimToken)}
                                        style={{
                                            background: '#6366f1',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem'
                                        }}
                                    >
                                        {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '1.5rem',
                                    background: '#fff7ed',
                                    border: '1px solid #ffedd5',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    color: '#9a3412',
                                    fontSize: '0.9rem'
                                }}>
                                    <AlertCircle size={20} />
                                    <span>No active SCIM token detected. Generate a new one to enable provisioning.</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleGenerateToken}
                            disabled={loading}
                            style={{
                                padding: '1rem 1.5rem',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)'
                            }}
                        >
                            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                            {scimToken ? 'Regenerate Token' : 'Generate SCIM Token'}
                        </button>
                    </div>
                ) : (
                    <div style={cardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                                    Outbound Sync (LDAP/AD)
                                </h2>
                                <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
                                    Periodically pull users from an on-prem or cloud LDAP directory.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>LDAP URL</label>
                                <input type="text" placeholder="ldaps://dc.example.com:636" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Base DN</label>
                                <input type="text" placeholder="dc=example,dc=com" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Bind DN</label>
                                <input type="text" placeholder="cn=sutra_svc,ou=ServiceAccounts,dc=example,dc=com" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Bind Password</label>
                                <input type="password" placeholder="••••••••••••" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>User Filter</label>
                                <input type="text" defaultValue="(objectClass=user)" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Group Filter</label>
                                <input type="text" defaultValue="(objectClass=group)" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button style={{
                                flex: 1,
                                padding: '1rem',
                                background: '#6366f1',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem'
                            }}>
                                <Server size={18} /> Save and Test Connection
                            </button>
                            <button style={{
                                padding: '1rem 2rem',
                                background: '#fff',
                                color: '#374151',
                                border: '1.5px solid #e5e7eb',
                                borderRadius: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <RefreshCcw size={18} /> Sync Now
                            </button>
                        </div>
                    </div>
                )}

                {/* Integration Status Section */}
                <div style={{
                    ...cardStyle,
                    background: 'linear-gradient(to right, #f8fafc, #ffffff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: '#dcfce7',
                            color: '#166534',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <RefreshCcw size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                                Propagation Insight
                            </h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.2rem 0 0' }}>
                                Last directory health check performed 12 minutes ago.
                            </p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Synced Users</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>1,248</div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1.5s linear infinite;
                }
            `}</style>
        </div>
    );
}
