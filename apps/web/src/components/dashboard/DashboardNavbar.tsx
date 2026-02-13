'use client';

import { Sun, Moon, Bell, Search, User } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface DashboardNavbarProps {
    colorMode: 'light' | 'dark' | 'auto';
    onColorModeChange: (mode: 'light' | 'dark' | 'auto') => void;
    user: any;
}

export default function DashboardNavbar({ colorMode, onColorModeChange, user }: DashboardNavbarProps) {
    const pathname = usePathname();

    // Simple breadcrumb generator
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        return { label, href: '/' + pathSegments.slice(0, index + 1).join('/') };
    });

    return (
        <header style={{
            height: '72px',
            background: 'rgba(var(--bg-card-rgb, 22, 27, 34), 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-color)',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 50,
        }}>
            {/* Search & Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ display: 'none', alignItems: 'center' }}>
                    {/* Desktop Breadcrumbs would go here if needed, but let's do a search bar instead for modern look */}
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '10px',
                    padding: '0.5rem 1rem',
                    width: '320px',
                    transition: 'all 0.2s',
                }}>
                    <Search size={18} color="var(--text-tertiary)" />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            outline: 'none',
                            width: '100%',
                        }}
                    />
                    <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)',
                        background: 'var(--bg-badge)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                    }}>⌘K</span>
                </div>
            </div>

            {/* Actions Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Theme Toggler */}
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-badge)',
                    padding: '4px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                }}>
                    <button
                        onClick={() => onColorModeChange(colorMode === 'light' ? 'dark' : 'light')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        title={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {colorMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                </div>

                {/* Notifications */}
                <button style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '10px',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Bell size={20} />
                    <span style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '8px',
                        height: '8px',
                        background: '#ef4444',
                        borderRadius: '50%',
                        border: '2px solid var(--bg-card)',
                    }} />
                </button>

                <div style={{ height: '24px', width: '1px', background: 'var(--border-color)', margin: '0 4px' }} />

                {/* Profile */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '10px',
                    transition: 'background 0.2s',
                }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <div style={{ textAlign: 'right', display: 'none' }}>
                        {/* Desktop only email could go here */}
                    </div>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: '600',
                        fontSize: '0.875rem',
                    }}>
                        {user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                </div>
            </div>

            <style jsx>{`
        header {
          --bg-card-rgb: 255, 255, 255;
        }
        :global(html[data-theme="dark"]) header {
          --bg-card-rgb: 26, 26, 26;
        }
      `}</style>
        </header>
    );
}
