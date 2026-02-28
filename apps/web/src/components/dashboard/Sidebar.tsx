'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AppWindow,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
  UsersRound,
} from 'lucide-react';
import { SutraLogoIcon } from '../SutraLogo';
import { OrgRole, roleVisibleTabs } from '@/lib/api';

interface SidebarProps {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
  user: any;
  onLogout: () => void;
  currentOrgId?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '', key: 'dashboard' },
  { icon: AppWindow, label: 'Applications', path: '/applications', key: 'applications' },
  { icon: Users, label: 'Users', path: '/users', key: 'users' },
  { icon: UsersRound, label: 'Groups', path: '/groups', key: 'groups' },
  { icon: Database, label: 'Directory Services', path: '/directory', key: 'directory' },
  { icon: KeyRound, label: 'SSO Providers', path: '/sso/providers', key: 'api-access' },
  { icon: Shield, label: 'Sign-in Policy', path: '/auth-policies', key: 'auth-policies' },
  { icon: ClipboardList, label: 'Authorization Policies', path: '/policies', key: 'policies' },
  { icon: FileText, label: 'Audit Logs', path: '/audit', key: 'audit' },
  { icon: Settings, label: 'Settings', path: '/settings', key: 'settings' },
];

export default function Sidebar({ collapsed, onToggle, user, onLogout, currentOrgId }: SidebarProps) {
  const pathname = usePathname();
  const role = (user?.role as OrgRole) || 'READ_ONLY_ADMIN';
  const visibleKeys = new Set(roleVisibleTabs[role] || roleVisibleTabs.READ_ONLY_ADMIN);

  const orgPrefix = '/dashboard';

  const items = navItems
    .filter((item) => visibleKeys.has(item.key))
    .map(item => ({
      ...item,
      href: `${orgPrefix}${item.path}`
    }));

  const isSuperAdmin = role === 'SUPER_ADMIN';

  return (
    <aside
      style={{
        width: collapsed ? '88px' : '290px',
        background: '#0f172a',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'fixed',
        height: '100vh',
        zIndex: 100,
        color: '#fff',
      }}
    >
      <div
        style={{
          padding: '1.1rem 1rem',
          height: '76px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SutraLogoIcon size={36} />
            <div>
              <div style={{ fontWeight: 700, letterSpacing: 0.2 }}>SutraID</div>
              {isSuperAdmin ? (
                <div
                  style={{
                    fontSize: '0.66rem',
                    marginTop: '2px',
                    background: 'rgba(34,211,238,0.15)',
                    color: '#67e8f9',
                    border: '1px solid rgba(34,211,238,0.35)',
                    borderRadius: '999px',
                    padding: '2px 8px',
                    display: 'inline-block',
                    fontWeight: 700,
                    letterSpacing: 0.4,
                  }}
                >
                  SUPER ADMIN
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <SutraLogoIcon size={36} />
        )}

        {!collapsed && (
          <button
            onClick={() => onToggle(true)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {collapsed ? (
        <button
          onClick={() => onToggle(false)}
          style={{
            position: 'absolute',
            right: '-12px',
            top: '26px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: '#2563eb',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <ChevronRight size={14} />
        </button>
      ) : null}

      <nav style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                color: active ? '#dbeafe' : '#94a3b8',
                background: active ? 'rgba(59,130,246,0.22)' : 'transparent',
                border: active ? '1px solid rgba(59,130,246,0.45)' : '1px solid transparent',
                borderRadius: '10px',
                padding: collapsed ? '11px' : '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <Icon size={18} />
              {!collapsed ? item.label : null}
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px' }}>
        {!collapsed ? (
          <div style={{ marginBottom: '10px', fontSize: '0.82rem', color: '#cbd5e1' }}>{user?.email}</div>
        ) : null}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            background: 'rgba(239,68,68,0.18)',
            border: '1px solid rgba(239,68,68,0.35)',
            color: '#fecaca',
            borderRadius: '10px',
            padding: collapsed ? '10px' : '9px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '8px',
          }}
        >
          <LogOut size={16} />
          {!collapsed ? 'Logout' : null}
        </button>
      </div>
    </aside>
  );
}
