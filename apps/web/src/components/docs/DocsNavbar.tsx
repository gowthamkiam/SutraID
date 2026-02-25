'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SutraLogo } from '../SutraLogo';

export default function DocsNavbar() {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('colorMode') as 'light' | 'dark' | 'auto' | null;
    if (saved === 'dark') {
      setColorMode('dark');
    } else if (saved === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setColorMode(prefersDark ? 'dark' : 'light');
    } else {
      setColorMode('light');
    }
  }, []);

  const toggleTheme = () => {
    const next = colorMode === 'light' ? 'dark' : 'light';
    setColorMode(next);
    localStorage.setItem('colorMode', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: '72px',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <SutraLogo
            size={24}
            fontSize="1.15rem"
            textColor="var(--text-primary)"
          />
        </Link>
        <span style={{ color: 'var(--border-color)', fontSize: '1.2rem', fontWeight: 300 }}>
          |
        </span>
        <Link
          href="/docs"
          style={{
            color: 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.88rem',
            textDecoration: 'none',
          }}
        >
          Developer Docs
        </Link>
      </div>

      {/* Right: Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link
          href="/docs/getting-started"
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          Quickstart
        </Link>
        <Link
          href="/docs/api-reference/authentication"
          style={{
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          API Reference
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
          style={{
            background: 'var(--bg-badge)',
            border: '1px solid var(--border-color)',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
        >
          {colorMode === 'light' ? '\u263E' : '\u2600'}
        </button>

        {/* Dashboard link */}
        <Link
          href="/login"
          style={{
            background: 'var(--accent-primary)',
            color: '#fff',
            textDecoration: 'none',
            padding: '0.45rem 1.1rem',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          Dashboard
        </Link>
      </div>
    </header>
  );
}
