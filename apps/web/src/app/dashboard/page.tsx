'use client';

import {
  Users,
  Activity,
  ShieldCheck,
  Zap,
  AppWindow,
  Fingerprint,
  FileText,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

function StatCard({ label, value, change, trend, icon: Icon, color }: StatCardProps) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.boxShadow = `0 8px 24px ${color}15`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${color}10`,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={24} />
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.75rem',
          fontWeight: '600',
          padding: '4px 8px',
          borderRadius: '20px',
          background: trend === 'up' ? '#10b98115' : trend === 'down' ? '#ef444415' : 'var(--bg-badge)',
          color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : 'var(--text-secondary)',
        }}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : trend === 'down' ? <ArrowDownRight size={14} /> : null}
          {change}
        </div>
      </div>

      <div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 4px' }}>{label}</p>
        <h3 style={{ fontSize: '1.75rem', fontWeight: '750', margin: 0, letterSpacing: '-0.02em' }}>{value}</h3>
      </div>

      {/* Subtle background glow */}
      <div style={{
        position: 'absolute',
        bottom: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        background: color,
        opacity: 0.05,
        filter: 'blur(30px)',
        borderRadius: '50%',
      }} />
    </div>
  );
}

export default function DashboardPage() {
  const stats: StatCardProps[] = [
    { label: 'Total Users', value: '2,543', change: '12.5%', trend: 'up', icon: Users, color: '#6366f1' },
    { label: 'Active Sessions', value: '1,234', change: '8.2%', trend: 'up', icon: Zap, color: '#10b981' },
    { label: 'SSO Providers', value: '3', change: 'Stable', trend: 'neutral', icon: ShieldCheck, color: '#f59e0b' },
    { label: 'Auth Events (24h)', value: '12.4K', change: '18.3%', trend: 'up', icon: Activity, color: '#ec4899' },
  ];

  const quickActions = [
    { title: 'New Application', icon: AppWindow, color: '#6366f1', description: 'Register a new OIDC or SAML app' },
    { title: 'Setup SSO', icon: ShieldCheck, color: '#8b5cf6', description: 'Configure Okta or Azure AD' },
    { title: 'MFA Policy', icon: Fingerprint, color: '#ec4899', description: 'Enable FaceID or TOTP' },
    { title: 'Audit Trail', icon: History, color: '#10b981', description: 'Search through security logs' },
  ];

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.025em' }}>
            Enterprise Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Real-time insights across your identity infrastructure.
          </p>
        </div>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--btn-primary-bg)',
          color: '#fff',
          border: 'none',
          padding: '10px 18px',
          borderRadius: '12px',
          fontWeight: '600',
          fontSize: '0.9rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
          transition: 'transform 0.2s',
        }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={18} />
          Create Project
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Main Content Areas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem'
      }}>
        {/* Recent Activity */}
        <section style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Recent Activity</h2>
            <button style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              View all
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { msg: 'User john@company.com via Okta', time: '2 mins ago', type: 'login' },
              { msg: 'New Application "Marketing CRM"', time: '45 mins ago', type: 'app' },
              { msg: 'MFA enabled for admin@company.com', time: '2 hours ago', type: 'security' },
              { msg: 'System Policy "Restrict Geo" updated', time: '5 hours ago', type: 'policy' },
            ].map((act, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid transparent',
                transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--bg-badge)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                }}>
                  <History size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: '500', margin: '0 0 2px' }}>{act.msg}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 1.5rem' }}>Quick Actions</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
          }}>
            {quickActions.map((action, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = action.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <action.icon size={28} color={action.color} style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: '0 0 4px' }}>{action.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  {action.description}
                </p>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '1.5rem',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: '700' }}>Developer Documentation</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', opacity: 0.9 }}>
              Learn how to integrate SutraID SDKs into your enterprise application.
            </p>
            <button style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}>
              View Docs
            </button>
            <Zap size={60} style={{
              position: 'absolute',
              right: '-10px',
              bottom: '-10px',
              opacity: 0.2,
              transform: 'rotate(-15deg)'
            }} />
          </div>
        </section>
      </div>
    </div>
  );
}
