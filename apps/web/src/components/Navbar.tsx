'use client';

import { useState } from 'react';

const navLinks = [
  { label: 'Product', href: '#product' },
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'Developers', href: '#developers' },
  { label: 'Resources', href: '#resources' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Company', href: '#company' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--nav-border)',
      padding: '0 2rem',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Logo */}
      <a href="/" style={{
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <span style={{
          fontSize: '1.35rem',
          fontWeight: 700,
          color: 'var(--accent-primary)',
          letterSpacing: '-0.02em',
        }}>
          SutraID
        </span>
      </a>

      {/* Desktop Nav Links */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
      }}>
        <div className="nav-links-desktop" style={{
          display: 'flex',
          gap: '1.75rem',
          alignItems: 'center',
        }}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                textDecoration: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a href="/login" style={{
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 500,
            padding: '0.5rem 1rem',
          }}>
            Log in
          </a>
          <a href="/login" style={{
            textDecoration: 'none',
            background: 'var(--btn-primary-bg)',
            color: 'var(--btn-primary-text)',
            fontSize: '0.875rem',
            fontWeight: 600,
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            transition: 'background 0.15s',
          }}>
            Get Started
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
          }}
        >
          {mobileOpen ? '\u2715' : '\u2630'}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="nav-mobile-menu" style={{
          position: 'absolute',
          top: '64px',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          padding: '1rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                textDecoration: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                fontWeight: 500,
                padding: '0.5rem 0',
              }}
            >
              {link.label}
            </a>
          ))}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <a href="/login" style={{
              textDecoration: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              fontWeight: 500,
              padding: '0.5rem 1rem',
            }}>
              Log in
            </a>
            <a href="/login" style={{
              textDecoration: 'none',
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              fontSize: '0.875rem',
              fontWeight: 600,
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
            }}>
              Get Started
            </a>
          </div>
        </div>
      )}

      {/* Responsive CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
        }
      `}} />
    </nav>
  );
}
