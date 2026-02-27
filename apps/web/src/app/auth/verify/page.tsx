'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyContent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        const response = await fetch(`${apiUrl}/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Verification failed');
        }

        // Store tokens
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));

        setStatus('success');
        setMessage('Successfully signed in! Redirecting...');

        // Redirect to dashboard
        setTimeout(() => {
          if (data.mustChangePassword || data.user?.mustChangePassword) {
            router.push('/auth/change-password');
            return;
          }
          router.push('/dashboard');
        }, 2000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Failed to verify magic link');
      }
    };

    verifyToken();
  }, [searchParams, router]);

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
    }}>
      <div style={{
        background: '#ffffff',
        padding: '3rem 2.5rem',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          fontSize: '2.25rem',
          fontWeight: 700,
          letterSpacing: '-0.5px',
          color: '#111827',
          marginBottom: '2rem',
        }}>
          <span style={{ color: '#4f46e5' }}>S</span>utra
          <span style={{ color: '#4f46e5' }}>ID</span>
        </div>

        {status === 'verifying' && (
          <>
            <div style={{
              width: '56px',
              height: '56px',
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #4f46e5',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              animation: 'spin 0.8s linear infinite',
            }} />
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#111827',
            }}>
              Verifying...
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
              Please wait while we verify your magic link
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '56px',
              height: '56px',
              background: '#ecfdf5',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#065f46',
              border: '2px solid #a7f3d0',
            }}>
              ✓
            </div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#065f46',
            }}>
              Success!
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0 }}>
              {message}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '56px',
              height: '56px',
              background: '#fef2f2',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#991b1b',
              border: '2px solid #fecaca',
            }}>
              ✕
            </div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#991b1b',
            }}>
              Verification Failed
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '0.95rem',
              marginBottom: '1.5rem',
            }}>
              {message}
            </p>
            <Link
              href="/login"
              style={{
                display: 'inline-block',
                padding: '0.8rem 2rem',
                background: '#4f46e5',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '50px',
                fontSize: '0.95rem',
                fontWeight: 600,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#4f46e5'}
            >
              Try Again
            </Link>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: '2rem',
        background: 'linear-gradient(160deg, #0a1628 0%, #0f2035 25%, #0d2847 50%, #0a2a3c 75%, #0e1f2f 100%)',
      }}>
        <div style={{
          background: '#ffffff',
          padding: '3rem 2.5rem',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            color: '#111827',
            marginBottom: '2rem',
          }}>
            <span style={{ color: '#4f46e5' }}>S</span>utra
            <span style={{ color: '#4f46e5' }}>ID</span>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Loading...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
