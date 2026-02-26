'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send reset link');
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            fontSize: '2.25rem',
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.5px',
            color: '#111827',
          }}>
            <span style={{ color: '#4f46e5' }}>S</span>utra
            <span style={{ color: '#4f46e5' }}>ID</span>
          </h1>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{
            color: '#374151',
            fontSize: '1.1rem',
            fontWeight: 500,
            margin: 0,
          }}>
            Reset your password
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
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
            <p style={{
              color: '#374151',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
            }}>
              If an account exists with <strong>{email}</strong>, we&apos;ve sent a password reset link.
              Check your email and follow the instructions.
            </p>
            <p style={{
              color: '#6b7280',
              fontSize: '0.85rem',
              marginBottom: '2rem',
            }}>
              The link expires in 15 minutes.
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
              }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <p style={{
              color: '#6b7280',
              fontSize: '0.9rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="email" style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  color: '#374151',
                }}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '1.5px solid #d1d5db',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                    color: '#111827',
                    background: '#fff',
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
                  width: '100%',
                  padding: '0.9rem',
                  background: loading ? '#9ca3af' : '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '1rem',
                  fontWeight: 600,
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            {error && (
              <div style={{
                marginTop: '1.25rem',
                padding: '1rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#991b1b',
                fontSize: '0.9rem',
                textAlign: 'center',
              }}>
                {error}
              </div>
            )}
          </>
        )}

        {!sent && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link
              href="/login"
              style={{
                color: '#4f46e5',
                fontSize: '0.9rem',
                textDecoration: 'none',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
