'use client';

import { useState } from 'react';

const inputStyle: React.CSSProperties = {
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
};

export default function OnboardPage() {
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const handleSubmit = async () => {
    if (!adminEmail.trim()) {
      setError('Admin email is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${apiUrl}/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminEmail: adminEmail.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to complete onboarding');
      }

      setComplete(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      <div style={{ maxWidth: '500px', width: '100%', position: 'relative', zIndex: 1 }}>
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
            Let&apos;s get you set up
          </p>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '3rem 2.5rem',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '1rem',
                borderRadius: '6px',
                marginBottom: '1.5rem',
              }}
            >
              {error}
            </div>
          )}

          {!complete ? (
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>
                Setup Administrator
              </h2>
              <p style={{ color: '#4b5563', fontSize: '1.05rem', marginBottom: '2rem' }}>
                Enter your email address to get started
              </p>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                    color: '#374151',
                  }}
                >
                  Admin Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  style={{ ...inputStyle }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#4f46e5';
                    e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && adminEmail && !loading) {
                      handleSubmit();
                    }
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: '2rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={handleSubmit}
                  disabled={!adminEmail || loading}
                  style={{
                    padding: '0.75rem 2rem',
                    background: (!adminEmail || loading) ? '#9ca3af' : '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: (!adminEmail || loading) ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { if (adminEmail && !loading) e.currentTarget.style.background = '#4338ca'; }}
                  onMouseLeave={(e) => { if (adminEmail && !loading) e.currentTarget.style.background = '#4f46e5'; }}
                >
                  {loading ? 'Sending...' : 'Get Started'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✉️</div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#111827', letterSpacing: '-0.5px', marginBottom: '1rem' }}>
                Magic link sent!
              </h2>
              <p style={{ color: '#4b5563', fontSize: '1.1rem', marginBottom: '2rem' }}>
                We&apos;ve sent a magic link to <strong>{adminEmail}</strong>.
              </p>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                Click the link in the email to verify your account and access your dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
