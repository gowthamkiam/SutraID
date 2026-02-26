'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orgInput, setOrgInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const orgParam = searchParams.get('org');
    const errorParam = searchParams.get('error');

    if (errorParam === 'org_not_found') {
      setError('Organization not found. Please check and try again.');
    }

    if (orgParam) {
      resolveAndRedirect(orgParam);
    }
  }, [searchParams]);

  const resolveAndRedirect = async (identifier: string) => {
    setLoading(true);
    setError('');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

    try {
      const response = await fetch(`${apiUrl}/auth/org-lookup/${encodeURIComponent(identifier)}`);
      if (!response.ok) {
        setError('Organization not found. Please check and try again.');
        setLoading(false);
        return;
      }
      const data = await response.json();
      router.push(`/login/${data.slug}`);
    } catch {
      setError('Organization not found. Please check and try again.');
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orgInput.trim();
    if (!trimmed) return;
    resolveAndRedirect(trimmed);
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
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        background: '#ffffff',
        padding: '3rem 2.5rem',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        maxWidth: '440px',
        width: '100%',
        position: 'relative',
        zIndex: 1,
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

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ color: '#374151', fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>
            Find your organization
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
            Enter your organization slug or ID to continue
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="orgSlug" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: '#374151',
            }}>
              Organization
            </label>
            <input
              id="orgSlug"
              type="text"
              value={orgInput}
              onChange={(e) => setOrgInput(e.target.value)}
              required
              placeholder="e.g. acme-corp"
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = '#4f46e5';
                e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              autoFocus
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
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#4338ca'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#4f46e5'; }}
          >
            {loading ? 'Looking up...' : 'Continue'}
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

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{"Don't have an organization? "}</span>
          <a
            href="/onboard"
            style={{ color: '#4f46e5', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Get started
          </a>
        </div>
      </div>
    </div>
  );
}
