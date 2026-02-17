'use client';

const footerSections = [
  {
    title: 'Product',
    links: [
      { label: 'Authentication', href: '#product' },
      { label: 'SSO', href: '#product' },
      { label: 'Multi-Tenancy', href: '#product' },
      { label: 'AI Agent Auth', href: '#product' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/docs/api-reference/authentication' },
      { label: 'SDKs', href: '/docs/getting-started' },
      { label: 'Quickstart', href: '/docs/getting-started' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '#resources' },
      { label: 'Guides', href: '#resources' },
      { label: 'Changelog', href: '#resources' },
      { label: 'Status', href: '#resources' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#company' },
      { label: 'Careers', href: '#company' },
      { label: 'Contact', href: '/support' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
];

export default function Footer() {
  return (
    // accessibility-fix: issue-24 - Added proper semantic structure and ARIA
    <footer
      id="company"
      role="contentinfo"
      aria-label="Site footer"
      style={{
        background: 'transparent',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '4rem 2rem 2rem',
      }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Top: Logo + Links */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem',
        }}>
          {/* Brand Column */}
          <div>
            <div style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              display: 'flex',
              alignItems: 'center',
              marginBottom: '1rem',
            }}>
              <span style={{ color: '#6366f1' }}>S</span>
              <span style={{ color: '#ffffff' }}>utra</span>
              <span style={{ color: '#6366f1' }}>ID</span>
            </div>
            <p style={{
              color: '#9ca3af',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              margin: 0,
            }}>
              The AI-native identity platform built for humans and intelligent agents.
            </p>
          </div>

          {/* accessibility-fix: issue-24 - Link Columns with proper nav structure */}
          {footerSections.map((section) => (
            <nav key={section.title} aria-labelledby={`footer-nav-${section.title.toLowerCase()}`}>
              <h4
                id={`footer-nav-${section.title.toLowerCase()}`}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '1rem',
                  marginTop: 0,
                }}
              >
                {section.title}
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', listStyle: 'none', padding: 0, margin: 0 }}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      style={{
                        textDecoration: 'none',
                        color: '#9ca3af',
                        fontSize: '0.875rem',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          {/* /accessibility-fix */}
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          color: '#6b7280',
        }}>
          <span style={{
            fontSize: '0.8rem',
          }}>
            &copy; {new Date().getFullYear()} SutraID. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="/privacy" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textDecoration: 'none' }}>Privacy</a>
            <a href="/security" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textDecoration: 'none' }}>Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
