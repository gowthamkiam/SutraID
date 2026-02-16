'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShieldCheck,
    Layers,
    Users,
    Key,
    FileText,
    History,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    AppWindow
} from 'lucide-react';

import { organizationSettingsApi } from '@/lib/api';

interface SidebarProps {
    collapsed: boolean;
    onToggle: (collapsed: boolean) => void;
    user: any;
    onLogout: () => void;
    currentOrgId: string | null;
}

const defaultNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', key: 'dashboard' },
    { icon: ShieldCheck, label: 'SSO Providers', href: '/dashboard/sso/providers', key: 'sso' },
    { icon: AppWindow, label: 'Applications', href: '/dashboard/applications', key: 'applications' },
    { icon: Users, label: 'Users', href: '/dashboard/users', key: 'users' },
    { icon: Layers, label: 'Directory', href: '/dashboard/directory', key: 'directory' },
    { icon: Key, label: 'Auth Methods', href: '/dashboard/authentication', key: 'auth_methods' },
    { icon: ShieldCheck, label: 'Security Policies', href: '/dashboard/policies', key: 'policies' },
    { icon: History, label: 'Audit Logs', href: '/dashboard/audit', key: 'audit_logs' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings', key: 'settings' },
];

export default function Sidebar({ collapsed, onToggle, user, onLogout, currentOrgId }: SidebarProps) {
    const pathname = usePathname();
    const [navItems, setNavItems] = useState(defaultNavItems);

    useEffect(() => {
        if (!currentOrgId) return;

        const fetchSettings = async () => {
            try {
                const settings = await organizationSettingsApi.getSettings(currentOrgId);

                const newItems = defaultNavItems.filter(item => {
                    // Always show Dashboard and Settings
                    if (item.key === 'dashboard' || item.key === 'settings') return true;

                    // Check if visible setting exists (defaults to true if not set)
                    const settingKey = `dashboard.tabs.${item.key}.visible`;
                    return settings[settingKey] !== 'false';
                });

                setNavItems(newItems);
            } catch (err) {
                console.error('Failed to load dashboard settings', err);
            }
        };

        fetchSettings();
    }, [currentOrgId]);

    return (
        <aside style={{
            width: collapsed ? '80px' : '280px',
            background: '#0f172a', // Deep enterprise navy
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'fixed',
            height: '100vh',
            zIndex: 100,
            color: '#fff',
        }}>
            {/* Brand/Logo Section */}
            <div style={{
                padding: '1.5rem',
                height: '72px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
                {!collapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                        }}>
                            <ShieldCheck size={20} color="#fff" strokeWidth={2.5} />
                        </div>
                        <span style={{
                            fontWeight: '700',
                            fontSize: '1.25rem',
                            letterSpacing: '-0.02em',
                            background: 'linear-gradient(to right, #fff, #cbd5e1)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            SutraID
                        </span>
                    </div>
                )}
                {collapsed && (
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <ShieldCheck size={22} color="#fff" strokeWidth={2.5} />
                    </div>
                )}

                {!collapsed && (
                    <button
                        onClick={() => onToggle(true)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <ChevronLeft size={16} />
                    </button>
                )}
            </div>

            {collapsed && (
                <button
                    onClick={() => onToggle(false)}
                    style={{
                        position: 'absolute',
                        right: '-12px',
                        top: '28px',
                        background: '#6366f1',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 110,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                >
                    <ChevronRight size={14} />
                </button>
            )}

            {/* Navigation Section */}
            <nav style={{ flex: 1, padding: '1.25rem 0.75rem', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: collapsed ? '12px' : '10px 12px',
                                    borderRadius: '10px',
                                    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                    color: isActive ? '#818cf8' : '#94a3b8',
                                    textDecoration: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: isActive ? '600' : '500',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                }}
                            >
                                <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.25 : 2} />
                                {!collapsed && <span>{item.label}</span>}
                                {isActive && !collapsed && (
                                    <div style={{
                                        marginLeft: 'auto',
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#6366f1',
                                        boxShadow: '0 0 8px #6366f1',
                                    }} />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Bottom Section - User Profile */}
            <div style={{
                padding: '1.25rem 0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    marginBottom: !collapsed ? '12px' : '0',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#fff',
                        flexShrink: 0,
                    }}>
                        {user?.email?.[0]?.toUpperCase() || 'A'}
                    </div>
                    {!collapsed && (
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <p style={{
                                margin: 0,
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                color: '#f8fafc',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {user?.email || 'Admin User'}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Enterprise Plan</p>
                        </div>
                    )}
                </div>

                {!collapsed && (
                    <button
                        onClick={onLogout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            background: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                        }}
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                )}
            </div>

            <style jsx global>{`
        ::-webkit-scrollbar {
          width: 5px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
        </aside>
    );
}
