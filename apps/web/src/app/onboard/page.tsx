'use client';

import Link from 'next/link';

export default function OnboardPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: '2rem',
        background: 'linear-gradient(160deg, #0a1628 0%, #0f2035 25%, #0d2847 50%, #0a2a3c 75%, #0e1f2f 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.5px',
            color: '#ffffff',
          }}>
            <span style={{ color: '#4f46e5' }}>S</span>utra<span style={{ color: '#4f46e5' }}>ID</span>
          </h1>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '3rem 2.5rem',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px', marginBottom: '1rem' }}>
            Onboarding Disabled
          </h2>
          <p style={{ color: '#4b5563', fontSize: '1rem', marginBottom: '2.5rem', lineHeight: 1.5 }}>
            Self-onboarding is currently disabled for this instance. Please contact your administrator if you need access.
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-block',
              width: '100%',
              boxSizing: 'border-box',
              padding: '0.75rem 2rem',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#4338ca'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#4f46e5'; }}
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
