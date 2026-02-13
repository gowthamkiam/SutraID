'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset password');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
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
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.5px', color: '#111827', marginBottom: '2rem' }}>
            <span style={{ color: '#4f46e5' }}>S</span>utra<span style={{ color: '#4f46e5' }}>ID</span>
          </div>
          <div style={{
            width: '56px', height: '56px', background: '#fef2f2', borderRadius: '50%',
            margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', color: '#991b1b', border: '2px solid #fecaca',
          }}>
            ✕
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#991b1b', marginBottom: '0.5rem' }}>
            Invalid Reset Link
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            No reset token was provided. Please request a new password reset.
          </p>
          <a href="/forgot-password" style={{
            display: 'inline-block', padding: '0.8rem 2rem', background: '#4f46e5', color: '#fff',
            textDecoration: 'none', borderRadius: '50px', fontSize: '0.95rem', fontWeight: 600,
          }}>
            Request New Link
          </a>
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
    }}>
      <div style={{
        background: '#ffffff',
        padding: '3rem 2.5rem',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        maxWidth: '440px',
        width: '100%',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <h1 style={{
            fontSize: '2.25rem', fontWeight: 700, margin: 0,
            letterSpacing: '-0.5px', color: '#111827',
          }}>
            <span style={{ color: '#4f46e5' }}>S</span>utra
            <span style={{ color: '#4f46e5' }}>ID</span>
          </h1>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ color: '#374151', fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>
            {success ? 'Password reset!' : 'Choose a new password'}
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', background: '#ecfdf5', borderRadius: '50%',
              margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', color: '#065f46', border: '2px solid #a7f3d0',
            }}>
              ✓
            </div>
            <p style={{ color: '#374151', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <a href="/login" style={{
              display: 'inline-block', padding: '0.8rem 2rem', background: '#4f46e5', color: '#fff',
              textDecoration: 'none', borderRadius: '50px', fontSize: '0.95rem', fontWeight: 600,
            }}>
              Sign In
            </a>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="password" style={{
                  display: 'block', marginBottom: '0.5rem', fontWeight: 500,
                  fontSize: '0.875rem', color: '#374151',
                }}>
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 8 characters"
                  style={{
                    width: '100%', padding: '0.875rem 1rem', border: '1.5px solid #d1d5db',
                    borderRadius: '10px', fontSize: '0.95rem', outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
                    color: '#111827', background: '#fff',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4f46e5';
                    e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="confirmPassword" style={{
                  display: 'block', marginBottom: '0.5rem', fontWeight: 500,
                  fontSize: '0.875rem', color: '#374151',
                }}>
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  style={{
                    width: '100%', padding: '0.875rem 1rem', border: '1.5px solid #d1d5db',
                    borderRadius: '10px', fontSize: '0.95rem', outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
                    color: '#111827', background: '#fff',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4f46e5';
                    e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '0.9rem',
                  background: loading ? '#9ca3af' : '#4f46e5',
                  color: '#fff', border: 'none', borderRadius: '50px',
                  fontSize: '1rem', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = '#4338ca';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = '#4f46e5';
                }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            {error && (
              <div style={{
                marginTop: '1.25rem', padding: '1rem', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b',
                fontSize: '0.9rem', textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <a href="/login" style={{
                color: '#4f46e5', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 500,
              }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Back to Sign In
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '2rem',
        background: 'linear-gradient(160deg, #0a1628 0%, #0f2035 25%, #0d2847 50%, #0a2a3c 75%, #0e1f2f 100%)',
      }}>
        <div style={{
          background: '#ffffff', padding: '3rem 2.5rem', borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)', maxWidth: '440px', width: '100%', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.5px', color: '#111827', marginBottom: '2rem' }}>
            <span style={{ color: '#4f46e5' }}>S</span>utra<span style={{ color: '#4f46e5' }}>ID</span>
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
