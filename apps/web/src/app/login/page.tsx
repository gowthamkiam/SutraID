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

  const bgColor = branding?.backgroundColor
    || 'radial-gradient(circle at 50% -20%, #2e2f5e 0%, #0a0a0b 100%)';

  const isGradient = bgColor.includes('gradient') || bgColor.includes('linear');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '2rem',
      ...(isGradient
        ? { background: bgColor }
        : { backgroundColor: bgColor }),
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle grid pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <div style={{
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '3.5rem 2.5rem',
        borderRadius: '32px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        maxWidth: '440px',
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        <LoginForm branding={branding} />
      </div>
    </div>
  );
}
