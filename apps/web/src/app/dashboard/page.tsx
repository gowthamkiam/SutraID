'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ColorMode = 'light' | 'dark' | 'auto';

interface StatCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  time: string;
  icon: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  // Mock data - replace with API calls
  const stats: StatCard[] = [
    { label: 'Total Users', value: '2,543', change: '+12.5%', trend: 'up', icon: '👥' },
    { label: 'Active Sessions', value: '1,234', change: '+8.2%', trend: 'up', icon: '🟢' },
    { label: 'SSO Providers', value: '3', change: '0', trend: 'neutral', icon: '🔐' },
    { label: 'Auth Events (24h)', value: '12.4K', change: '+18.3%', trend: 'up', icon: '📊' },
  ];

  const quickActions: QuickAction[] = [
    {
      title: 'SSO Providers',
      description: 'Manage SAML and OIDC integrations',
      icon: '🔐',
      href: '/dashboard/sso/providers',
      color: '#6366f1',
    },
    {
      title: 'Applications',
      description: 'Configure your applications',
      icon: '📱',
      href: '/dashboard/applications',
      color: '#8b5cf6',
    },
    {
      title: 'Users',
      description: 'Manage user accounts',
      icon: '👤',
      href: '/dashboard/users',
      color: '#ec4899',
    },
    {
      title: 'Authentication',
      description: 'Configure auth methods',
      icon: '🔑',
      href: '/dashboard/authentication',
      color: '#f59e0b',
    },
    {
      title: 'Policies',
      description: 'Authorization rules & access control',
      icon: '📋',
      href: '/dashboard/policies',
      color: '#0ea5e9',
    },
    {
      title: 'Audit Logs',
      description: 'View security events',
      icon: '📜',
      href: '/dashboard/audit',
      color: '#10b981',
    },
    {
      title: 'Settings',
      description: 'Organization settings',
      icon: '⚙️',
      href: '/dashboard/settings',
      color: '#6b7280',
    },
  ];

  const recentActivity: Activity[] = [
    { id: '1', type: 'login', message: 'User john@example.com logged in via SSO', time: '2 min ago', icon: '🔓' },
    { id: '2', type: 'sso', message: 'SSO Provider "Okta" was updated', time: '1 hour ago', icon: '🔐' },
    { id: '3', type: 'user', message: 'New user sarah@example.com was created', time: '3 hours ago', icon: '👤' },
    { id: '4', type: 'auth', message: 'Magic link sent to admin@example.com', time: '5 hours ago', icon: '✉️' },
  ];

  // Load saved color mode
  useEffect(() => {
    const saved = localStorage.getItem('colorMode') as ColorMode | null;
    if (saved) setColorMode(saved);
  }, []);

  const handleColorModeChange = (mode: ColorMode) => {
    setColorMode(mode);
    localStorage.setItem('colorMode', mode);

    let resolvedMode = mode;
    if (mode === 'auto') {
      resolvedMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolvedMode);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (!accessToken || !storedUser) {
        router.push('/login');
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Token expired');
        }

        const data = await response.json();
        setUser(data.user);

        // Check if user has an organization — redirect to onboard if not
        if (!localStorage.getItem('currentOrgId')) {
          try {
            const orgsResponse = await fetch(`${apiUrl}/organizations`, {
              headers: { 'Authorization': `Bearer ${accessToken}` },
            });
            const orgs = await orgsResponse.json();
            if (orgs && orgs.length > 0) {
              localStorage.setItem('currentOrgId', orgs[0].id);
            } else {
              router.push('/onboard');
              return;
            }
          } catch {
            // If org check fails, continue to dashboard
          }
        }
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        await fetch(`${apiUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary, #0f1419)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(99, 102, 241, 0.1)',
          borderTop: '4px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'var(--bg-primary, #0f1419)',
      color: 'var(--text-primary, #e6edf3)',
      display: 'flex'
    }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarCollapsed ? '80px' : '260px',
        background: 'var(--bg-card, #161b22)',
        borderRight: '1px solid var(--border-color, #30363d)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'fixed',
        height: '100vh',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-color, #30363d)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}>
                🔐
              </div>
              <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>SutraID</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #7d8590)',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0.25rem'
            }}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { icon: '📊', label: 'Dashboard', href: '/dashboard', active: true },
              { icon: '🔐', label: 'SSO Providers', href: '/dashboard/sso/providers' },
              { icon: '📱', label: 'Applications', href: '/dashboard/applications' },
              { icon: '👥', label: 'Users', href: '/dashboard/users' },
              { icon: '🔑', label: 'Auth Methods', href: '/dashboard/authentication' },
              { icon: '📋', label: 'Policies', href: '/dashboard/policies' },
              { icon: '📜', label: 'Audit Logs', href: '/dashboard/audit' },
              { icon: '⚙️', label: 'Settings', href: '/dashboard/settings' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: item.active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: item.active ? '#a5b4fc' : 'var(--text-secondary, #7d8590)',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: item.active ? '600' : '500',
                  transition: 'all 0.2s',
                  border: item.active ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </a>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-color, #30363d)',
        }}>
          {!sidebarCollapsed ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ec4899, #f59e0b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#fff'
                }}>
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary, #6e7681)' }}>
                    Admin
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary, #7d8590)',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '0.25rem'
                }}
                title="Logout"
              >
                🚪
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--text-secondary, #7d8590)',
                cursor: 'pointer',
                fontSize: '1.5rem'
              }}
              title="Logout"
            >
              🚪
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: sidebarCollapsed ? '80px' : '260px',
        transition: 'margin-left 0.3s ease',
        overflowY: 'auto'
      }}>
        {/* Top Bar */}
        <header style={{
          background: 'var(--bg-card, #161b22)',
          borderBottom: '1px solid var(--border-color, #30363d)',
          padding: '1.25rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                margin: '0 0 0.25rem',
                background: 'linear-gradient(135deg, #e6edf3, #a5b4fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Hi there! 👋
              </h1>
              <p style={{ color: 'var(--text-secondary, #7d8590)', margin: 0, fontSize: '0.95rem' }}>
                Welcome back to your dashboard
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {/* Color Mode Switcher */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '0.25rem',
                display: 'flex',
                gap: '0.25rem'
              }}>
                {([
                  { mode: 'light' as ColorMode, icon: '☀️' },
                  { mode: 'dark' as ColorMode, icon: '🌙' },
                  { mode: 'auto' as ColorMode, icon: '◐' },
                ]).map(({ mode, icon }) => (
                  <button
                    key={mode}
                    onClick={() => handleColorModeChange(mode)}
                    style={{
                      background: colorMode === mode ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      transition: 'background 0.2s'
                    }}
                    title={mode}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div style={{ padding: '2rem' }}>
          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{
                background: 'var(--bg-card, #161b22)',
                border: '1px solid var(--border-color, #30363d)',
                borderRadius: '12px',
                padding: '1.5rem',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color, #30363d)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>{stat.icon}</span>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    color: stat.trend === 'up' ? '#10b981' : stat.trend === 'down' ? '#ef4444' : 'var(--text-secondary, #7d8590)',
                    background: stat.trend === 'up' ? 'rgba(16, 185, 129, 0.15)' : stat.trend === 'down' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(125, 133, 144, 0.15)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px'
                  }}>
                    {stat.change}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #7d8590)', marginBottom: '0.25rem' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: 'var(--text-primary, #e6edf3)'
            }}>
              Quick Actions
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.25rem'
            }}>
              {quickActions.map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  style={{
                    background: 'var(--bg-card, #161b22)',
                    border: '1px solid var(--border-color, #30363d)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = action.color;
                    e.currentTarget.style.boxShadow = `0 4px 12px ${action.color}25`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color, #30363d)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                    {action.icon}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {action.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #7d8590)', margin: 0 }}>
                    {action.description}
                  </p>
                </a>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: 'var(--text-primary, #e6edf3)'
            }}>
              Recent Activity
            </h2>
            <div style={{
              background: 'var(--bg-card, #161b22)',
              border: '1px solid var(--border-color, #30363d)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              {recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: index < recentActivity.length - 1 ? '1px solid var(--border-color, #30363d)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}>
                    {activity.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                      {activity.message}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary, #6e7681)' }}>
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
