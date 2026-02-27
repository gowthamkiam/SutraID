'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NavItem } from '@/app/docs/api-data/types';

const navigation: NavItem[] = [
  { label: 'Overview', href: '/docs' },
  { label: 'Getting Started', href: '/docs/getting-started' },
  { label: 'Authentication Guide', href: '/docs/authentication' },
  { label: 'Error Handling', href: '/docs/errors' },
  {
    label: 'API Reference',
    children: [
      { label: 'Authentication & MFA', href: '/docs/api-reference/authentication' },
      { label: 'Users', href: '/docs/api-reference/users' },
      { label: 'Groups', href: '/docs/api-reference/groups' },
      { label: 'Applications', href: '/docs/api-reference/applications' },
      { label: 'SSO', href: '/docs/api-reference/sso' },
      { label: 'OIDC Provider', href: '/docs/api-reference/oidc-provider' },
      { label: 'SAML Provider', href: '/docs/api-reference/saml-provider' },
      { label: 'OIDC Configuration', href: '/docs/api-reference/oidc-config' },
      { label: 'Audit Logs', href: '/docs/api-reference/audit' },
      { label: 'Policies', href: '/docs/api-reference/policies' },
      { label: 'Directory (SCIM/LDAP)', href: '/docs/api-reference/directory' },
    ],
  },
];

export default function DocsSidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'API Reference': true,
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => pathname === href;

  const renderNav = () => (
    <>
      {navigation.map((item) => {
        if (item.children) {
          const isExpanded = expandedSections[item.label] !== false;
          const hasActiveChild = item.children.some((c) => c.href && isActive(c.href));
          return (
            <div key={item.label} style={{ marginBottom: '0.25rem' }}>
              <button
                onClick={() => toggleSection(item.label)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: hasActiveChild ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                }}
              >
                {item.label}
                <span
                  style={{
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    fontSize: '0.8rem',
                  }}
                >
                  &#9662;
                </span>
              </button>
              {isExpanded && (
                <div>
                  {item.children.map((child) => {
                    if (!child.href) return null;
                    const active = isActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        style={{
                          display: 'block',
                          padding: '0.4rem 1.5rem 0.4rem 2rem',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontWeight: active ? 600 : 400,
                          borderLeft: active
                            ? '2px solid var(--accent-primary)'
                            : '2px solid transparent',
                          background: active ? 'var(--accent-light)' : 'transparent',
                          transition: 'all 0.15s',
                        }}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        if (!item.href) return null;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            style={{
              display: 'block',
              padding: '0.5rem 1.5rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
              background: active ? 'var(--accent-light)' : 'transparent',
              borderLeft: active
                ? '2px solid var(--accent-primary)'
                : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle docs navigation"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 60,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--accent-primary)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.3rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
        className="docs-sidebar-mobile-toggle"
      >
        {mobileOpen ? '\u2715' : '\u2630'}
      </button>

      {/* Sidebar */}
      <aside
        className="docs-sidebar"
        style={{
          width: '260px',
          minWidth: '260px',
          borderRight: '1px solid var(--border-color)',
          padding: '1.5rem 0',
          position: 'sticky',
          top: '72px',
          height: 'calc(100vh - 72px)',
          overflowY: 'auto',
          background: 'var(--bg-card)',
        }}
      >
        {renderNav()}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 49,
          }}
          className="docs-sidebar-overlay"
        />
      )}

      {/* Responsive styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 900px) {
              .docs-sidebar-mobile-toggle { display: flex !important; align-items: center; justify-content: center; }
              .docs-sidebar-overlay { display: block !important; }
              .docs-sidebar {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                height: 100vh !important;
                z-index: 50;
                transform: ${mobileOpen ? 'translateX(0)' : 'translateX(-100%)'};
                transition: transform 0.3s ease;
                box-shadow: ${mobileOpen ? '4px 0 12px rgba(0,0,0,0.1)' : 'none'};
              }
            }
          `,
        }}
      />
    </>
  );
}
