'use client';

import { useState, useEffect } from 'react';
import LoginForm, { CustomLoginConfig } from '@/components/auth/LoginForm';

interface BrandingResponse {
  logoUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
  customCss?: string;
}

export default function LoginPage() {
  const [branding, setBranding] = useState<CustomLoginConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      try {
        const response = await fetch(`${apiUrl}/auth/branding`);
        if (response.ok) {
          const data: BrandingResponse = await response.json();
          setBranding(data);
        }
      } catch {
        // Use default branding
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0a1628 0%, #0f2035 25%, #0d2847 50%, #0a2a3c 75%, #0e1f2f 100%)',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.8 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
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
    }}>
      <div style={{ maxWidth: '440px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.5px',
            color: '#ffffff',
          }}>
            Welcome to <span style={{ color: '#4f46e5' }}>S</span>utra<span style={{ color: '#4f46e5' }}>ID</span>
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', margin: 0 }}>
            Sign in to continue
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          padding: '3rem 2.5rem 1rem', // Reduced bottom padding slightly to pull copyright/footer closer
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}>
          <LoginForm branding={branding} />

          {/* Integrated Simple Footer */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
              <a href="/privacy" style={{ color: '#6b7280', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#111827'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>Privacy Policy</a>
              <a href="/security" style={{ color: '#6b7280', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#111827'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>Security</a>
              <a href="/support" style={{ color: '#6b7280', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#111827'} onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}>Contact</a>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>&copy; {new Date().getFullYear()} SutraID. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
