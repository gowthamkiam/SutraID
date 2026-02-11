'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ColorMode = 'light' | 'dark' | 'auto';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const router = useRouter();

  // Load saved color mode
  useEffect(() => {
    const saved = localStorage.getItem('colorMode') as ColorMode | null;
    if (saved) setColorMode(saved);
  }, []);

  const handleColorModeChange = (mode: ColorMode) => {
    setColorMode(mode);
    localStorage.setItem('colorMode', mode);

    let resolvedMode = mode;
    if (mode === 'auto') {
      resolvedMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolvedMode);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (!accessToken || !storedUser) {
        router.push('/login');
        return;
      }

      try {
        // Verify token is still valid by calling /auth/me
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        const response = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Token expired');
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        // Token invalid or expired, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        await fetch(`${apiUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Redirect to login
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      background: 'var(--bg-primary, #f9fafb)',
      color: 'var(--text-primary, #000)'
    }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-card, #fff)',
        borderBottom: '1px solid var(--border-color, #e5e7eb)',
        padding: '1rem 2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
            SutraID Dashboard
          </h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-card, #fff)',
              color: 'var(--text-primary, #000)',
              border: '1px solid var(--border-input, #ddd)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Welcome Card */}
        <div style={{
          background: 'var(--bg-card, #fff)',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0, 0, 0, 0.1))',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Welcome back!
          </h2>
          <p style={{ color: 'var(--text-secondary, #666)', marginBottom: '1.5rem' }}>
            You're successfully authenticated with SutraID
          </p>

          <div style={{
            background: 'var(--bg-primary, #f9fafb)',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color, #e5e7eb)'
          }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: '600' }}>
              Your Profile
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <span style={{ color: 'var(--text-secondary, #666)', fontSize: '0.9rem' }}>Email: </span>
                <span style={{ fontWeight: '500' }}>{user.email}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary, #666)', fontSize: '0.9rem' }}>User ID: </span>
                <span style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {user.id}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary, #666)', fontSize: '0.9rem' }}>Status: </span>
                <span style={{
                  background: 'var(--success-bg, #d4edda)',
                  color: 'var(--success-text, #155724)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  fontWeight: '500'
                }}>
                  {user.status}
                </span>
              </div>
              {user.emailVerified && (
                <div>
                  <span style={{ color: 'var(--text-secondary, #666)', fontSize: '0.9rem' }}>Email Verified: </span>
                  <span style={{ color: 'var(--success-text, #155724)' }}>Yes</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'var(--bg-card, #fff)',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0, 0, 0, 0.1))',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/dashboard/sso/providers')}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--btn-primary-bg, #000)',
                color: 'var(--btn-primary-text, #fff)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Manage SSO Providers
            </button>
          </div>
        </div>

        {/* Mode Settings */}
        <div style={{
          background: 'var(--bg-card, #fff)',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0, 0, 0, 0.1))',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', fontWeight: '600' }}>
            Mode
          </h2>
          <p style={{ color: 'var(--text-secondary, #666)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Choose a color mode.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {([
              { mode: 'light' as ColorMode, label: 'Light', icon: '\u2600' },
              { mode: 'dark' as ColorMode, label: 'Dark', icon: '\u263E' },
              { mode: 'auto' as ColorMode, label: 'Auto', icon: '\u25D0' },
            ]).map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => handleColorModeChange(mode)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: colorMode === mode ? 'var(--btn-primary-bg, #000)' : 'var(--bg-input, #fff)',
                  color: colorMode === mode ? 'var(--btn-primary-text, #fff)' : 'var(--text-primary, #000)',
                  border: `2px solid ${colorMode === mode ? 'var(--btn-primary-bg, #000)' : 'var(--border-input, #ddd)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            { title: 'Passwordless Auth', desc: 'Secure magic link authentication without passwords' },
            { title: 'AI-Native', desc: 'Built for humans AND AI agents' },
            { title: '$0/month', desc: 'Free tier for demo and early adoption' },
          ].map((feature) => (
            <div key={feature.title} style={{
              background: 'var(--bg-card, #fff)',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0, 0, 0, 0.1))'
            }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--text-secondary, #666)', fontSize: '0.9rem' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
