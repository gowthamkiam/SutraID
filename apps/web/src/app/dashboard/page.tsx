'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { OrgRole, roleVisibleTabs } from '@/lib/api';

type StatCard = {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
};

type QuickAction = {
  key: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
};

type Activity = {
  id: string;
  message: string;
  time: string;
  icon: string;
};

const stats: StatCard[] = [
  { label: 'Total Users', value: '2,543', change: '+12.5%', trend: 'up', icon: '👥' },
  { label: 'Active Sessions', value: '1,234', change: '+8.2%', trend: 'up', icon: '🟢' },
  { label: 'SSO Providers', value: '3', change: '0', trend: 'neutral', icon: '🔐' },
  { label: 'Auth Events (24h)', value: '12.4K', change: '+18.3%', trend: 'up', icon: '📊' },
];

const quickActions: QuickAction[] = [
  {
    key: 'api-access',
    title: 'SSO Providers',
    description: 'Manage SAML and OIDC integrations',
    icon: '🔐',
    href: '/dashboard/sso/providers',
    color: '#6366f1',
  },
  {
    key: 'applications',
    title: 'Applications',
    description: 'Configure your applications',
    icon: '📱',
    href: '/dashboard/applications',
    color: '#8b5cf6',
  },
  {
    key: 'users',
    title: 'Users',
    description: 'Manage user accounts',
    icon: '👤',
    href: '/dashboard/users',
    color: '#ec4899',
  },
  {
    key: 'applications',
    title: 'Authentication',
    description: 'Configure auth methods',
    icon: '🔑',
    href: '/dashboard/authentication',
    color: '#f59e0b',
  },
  {
    key: 'reports',
    title: 'Policies',
    description: 'Authorization rules and access control',
    icon: '📋',
    href: '/dashboard/policies',
    color: '#0ea5e9',
  },
  {
    key: 'reports',
    title: 'Audit Logs',
    description: 'View security events',
    icon: '📜',
    href: '/dashboard/audit',
    color: '#10b981',
  },
  {
    key: 'settings',
    title: 'Settings',
    description: 'Organization settings',
    icon: '⚙️',
    href: '/dashboard/settings',
    color: '#6b7280',
  },
];

const recentActivity: Activity[] = [
  { id: '1', message: 'User john@example.com logged in via SSO', time: '2 min ago', icon: '🔓' },
  { id: '2', message: 'SSO Provider "Okta" was updated', time: '1 hour ago', icon: '🔐' },
  { id: '3', message: 'New user sarah@example.com was created', time: '3 hours ago', icon: '👤' },
  { id: '4', message: 'Magic link sent to admin@example.com', time: '5 hours ago', icon: '✉️' },
];

export default function DashboardPage() {
  const role = useMemo(() => {
    if (typeof window === 'undefined') return 'READ_ONLY_ADMIN' as OrgRole;
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return 'READ_ONLY_ADMIN' as OrgRole;
      return (JSON.parse(raw).role || 'READ_ONLY_ADMIN') as OrgRole;
    } catch {
      return 'READ_ONLY_ADMIN' as OrgRole;
    }
  }, []);

  const visibleKeys = new Set(roleVisibleTabs[role] || roleVisibleTabs.READ_ONLY_ADMIN);
  const visibleQuickActions = quickActions.filter((action) => visibleKeys.has(action.key));

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Dashboard</h1>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          Welcome back to your organization overview.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.6rem' }}>{stat.icon}</span>
              <span
                style={{
                  fontSize: '0.8rem',
                  color:
                    stat.trend === 'up'
                      ? '#10b981'
                      : stat.trend === 'down'
                        ? '#ef4444'
                        : 'var(--text-secondary)',
                }}
              >
                {stat.change}
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{stat.label}</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, marginTop: '0.25rem' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {visibleQuickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'block',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{action.icon}</div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{action.title}</h3>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {action.description}
              </p>
              <div style={{ marginTop: '0.75rem', height: '2px', background: action.color, opacity: 0.5 }} />
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Recent Activity</h2>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          {recentActivity.map((activity, index) => (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.25rem',
                borderBottom: index === recentActivity.length - 1 ? 'none' : '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{activity.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.95rem' }}>{activity.message}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
