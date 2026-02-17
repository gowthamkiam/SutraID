'use client';

import { useState, useEffect } from 'react';

const navLinks = [
  { label: 'Product', href: '#product' },
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'Developers', href: '/docs' },
  { label: 'Resources', href: '#resources' },
  { label: 'Company', href: '#company' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navTheme = isScrolled ? 'light' : 'dark';

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: isScrolled ? 'rgba(255, 255, 255, 0.8)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(0,0,0,0.1)' : '1px solid transparent',
        padding: '0 2rem',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease',
      }}
    >
      <a href="/" style={{
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
      }}>
        <div style={{
          fontSize: '1.4rem',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.3s ease',
        }}>
          <span style={{ color: '#6366f1' }}>S</span>
          <span style={{ color: navTheme === 'dark' ? '#ffffff' : '#111827' }}>utra</span>
          <span style={{ color: '#6366f1' }}>ID</span>
        </div>
      </a>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
      }}>
        <div className="nav-links-desktop" style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
        }}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                textDecoration: 'none',
                color: navTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4b5563',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = navTheme === 'dark' ? '#ffffff' : '#111827')}
              onMouseLeave={(e) => (e.currentTarget.style.color = navTheme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#4b5563')}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="/login" style={{
            textDecoration: 'none',
            color: navTheme === 'dark' ? '#ffffff' : '#111827',
            fontSize: '0.9rem',
            fontWeight: 600,
            padding: '0.5rem 1rem',
          }}>
            Log in
          </a>
          <a href="/login" style={{
            textDecoration: 'none',
            background: '#6366f1',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 700,
            padding: '0.65rem 1.5rem',
            borderRadius: '10px',
            transition: 'all 0.2s ease',
            boxShadow: navTheme === 'dark' ? '0 4px 15px rgba(99, 102, 241, 0.3)' : 'none',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#4f46e5';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#6366f1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Get Started
          </a>
        </div>

        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            color: navTheme === 'dark' ? '#ffffff' : '#111827',
            fontSize: '1.5rem',
          }}
        >
          <span aria-hidden="true">{mobileOpen ? '\u2715' : '\u2630'}</span>
        </button>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav-menu"
          className="nav-mobile-menu"
          role="menu"
          aria-label="Mobile navigation"
          style={{
            position: 'absolute',
            top: '72px',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            padding: '1.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                textDecoration: 'none',
                color: '#4b5563',
                fontSize: '1rem',
                fontWeight: 600,
                padding: '0.5rem 0',
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', display: 'flex', gap: '1rem' }}>
            <a href="/login" style={{
              textDecoration: 'none',
              color: '#111827',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '0.5rem 1rem',
            }}>
              Log in
            </a>
            <a href="/login" style={{
              textDecoration: 'none',
              background: '#6366f1',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              textAlign: 'center',
              flex: 1,
            }}>
              Get Started
            </a>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
        }
      `}} />
    </nav>
  );
}
