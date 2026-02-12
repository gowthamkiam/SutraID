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
      { label: 'Documentation', href: '#developers' },
      { label: 'API Reference', href: '#developers' },
      { label: 'SDKs', href: '#developers' },
      { label: 'Quickstart', href: '#developers' },
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
    <footer id="company" style={{
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border-color)',
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
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
            }}>
              SutraID
            </div>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              margin: 0,
            }}>
              The AI-native identity platform built for humans and intelligent agents.
            </p>
          </div>

          {/* Link Columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '1rem',
                marginTop: 0,
              }}>
                {section.title}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {section.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{
                      textDecoration: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <span style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.8rem',
          }}>
            &copy; {new Date().getFullYear()} SutraID. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textDecoration: 'none' }}>Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
