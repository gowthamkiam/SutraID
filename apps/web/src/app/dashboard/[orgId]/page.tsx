'use client';

import Link from 'next/link';
import { useMemo, use, useState, useEffect } from 'react';
import { OrgRole, roleVisibleTabs, usersApi, ssoApi, auditApi, statsApi } from '@/lib/api';

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

const quickActionsBase = [
  {
    key: 'api-access',
    title: 'SSO Providers',
    description: 'Manage SAML and OIDC integrations',
    icon: '🔐',
    path: '/sso/providers',
    color: '#6366f1',
  },
  {
    key: 'applications',
    title: 'Applications',
    description: 'Configure your applications',
    icon: '📱',
    path: '/applications',
    color: '#8b5cf6',
  },
  {
    key: 'users',
    title: 'Users',
    description: 'Manage user accounts',
    icon: '👤',
    path: '/users',
    color: '#ec4899',
  },
  {
    key: 'oidc-config',
    title: 'Authentication',
    description: 'Configure auth methods',
    icon: '🔑',
    path: '/settings/oidc',
    color: '#f59e0b',
  },
  {
    key: 'policies',
    title: 'Policies',
    description: 'Authorization rules and access control',
    icon: '📋',
    path: '/policies',
    color: '#0ea5e9',
  },
  {
    key: 'audit',
    title: 'Audit Logs',
    description: 'View security events',
    icon: '📜',
    path: '/audit',
    color: '#10b981',
  },
  {
    key: 'settings',
    title: 'Settings',
    description: 'Organization settings',
    icon: '⚙️',
    path: '/settings',
    color: '#6b7280',
  },
];

export default function DashboardPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);

  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    ssoProviders: 0,
    authEvents: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return new Intl.NumberFormat('en-US').format(num);
    }
    return String(num);
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getIconForAction = (action: string, result: string): string => {
    if (result === 'FAILURE') return '❌';
    if (result === 'DENIED') return '🚫';

    if (action.includes('LOGIN')) return '🔓';
    if (action.includes('SSO')) return '🔐';
    if (action.includes('USER_CREATE')) return '👤';
    if (action.includes('APPLICATION')) return '📱';
    if (action.includes('PROVIDER')) return '🔐';
    return '📊';
  };

  const formatAuditMessage = (log: any): string => {
    const userEmail = log.metadata?.userEmail || log.metadata?.email || 'Unknown user';
    const resource = log.resource || '';

    const actionMap: Record<string, string> = {
      'USER_LOGIN': `User ${userEmail} logged in`,
      'SSO_LOGIN': `User ${userEmail} logged in via SSO`,
      'USER_CREATED': `New user ${userEmail} was created`,
      'SSO_PROVIDER_CREATED': `SSO Provider "${resource}" was created`,
      'SSO_PROVIDER_UPDATED': `SSO Provider "${resource}" was updated`,
      'APPLICATION_CREATED': `Application "${resource}" was created`,
      'MAGIC_LINK_SENT': `Magic link sent to ${userEmail}`,
    };

    return actionMap[log.action] || `${log.action} - ${resource}`;
  };

  const transformAuditLogs = (logs: any[]): Activity[] => {
    return logs.map(log => ({
      id: log.id,
      message: formatAuditMessage(log),
      time: formatTimeAgo(log.createdAt),
      icon: getIconForAction(log.action, log.result),
    }));
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, providersData, activeSessionsData, auditStatsData, auditLogsData] =
        await Promise.all([
          usersApi.list({ page: 1, limit: 1 }),
          ssoApi.listProviders(orgId),
          statsApi.getActiveSessions(orgId),
          auditApi.getStats(orgId, 1),
          auditApi.getLogs(orgId, { limit: 5 }),
        ]);

      setDashboardStats({
        totalUsers: usersData.total,
        activeSessions: activeSessionsData.activeSessions,
        ssoProviders: providersData.length,
        authEvents: auditStatsData.totalEvents,
      });

      setRecentActivity(transformAuditLogs(auditLogsData.logs));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [orgId]);

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

  const quickActions = useMemo(() =>
    quickActionsBase.map(action => ({
      ...action,
      href: `/dashboard/${orgId}${action.path}`
    })), [orgId]);

  const visibleKeys = new Set(roleVisibleTabs[role] || roleVisibleTabs.READ_ONLY_ADMIN);
  const visibleQuickActions = quickActions.filter((action) => visibleKeys.has(action.key));

  const stats: StatCard[] = [
    {
      label: 'Total Users',
      value: formatNumber(dashboardStats.totalUsers),
      change: '',
      trend: 'neutral',
      icon: '👥',
    },
    {
      label: 'Active Sessions',
      value: formatNumber(dashboardStats.activeSessions),
      change: '',
      trend: 'neutral',
      icon: '🟢',
    },
    {
      label: 'SSO Providers',
      value: String(dashboardStats.ssoProviders),
      change: '',
      trend: 'neutral',
      icon: '🔐',
    },
    {
      label: 'Auth Events (24h)',
      value: formatNumber(dashboardStats.authEvents),
      change: '',
      trend: 'neutral',
      icon: '📊',
    },
  ];

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Dashboard</h1>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            Welcome back to your organization overview.
          </p>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading dashboard data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Dashboard</h1>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            Welcome back to your organization overview.
          </p>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#ef4444',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
        }}>
          {error}
        </div>
      </div>
    );
  }

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
              {stat.change && (
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
              )}
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
