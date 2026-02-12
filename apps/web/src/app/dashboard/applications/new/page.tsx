'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { applicationApi, AppType } from '@/lib/api';

export default function NewApplicationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AppType>('WEB');
  const [redirectUris, setRedirectUris] = useState('');
  const [allowedOrigins, setAllowedOrigins] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('currentOrgId');
    if (stored) setOrgId(stored);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) { setError('No organization found.'); return; }
    if (!name.trim()) { setError('Name is required.'); return; }

    setError(null);
    setSubmitting(true);
    try {
      const result = await applicationApi.create(orgId, {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        redirectUris: redirectUris.split('\n').map(s => s.trim()).filter(Boolean),
        allowedOrigins: allowedOrigins.split('\n').map(s => s.trim()).filter(Boolean),
      });
      setCreatedSecret(result.clientSecret);
    } catch (err: any) {
      setError(err.message || 'Failed to create application');
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    background: 'var(--bg-primary, #0f1419)',
    border: '1px solid var(--border-color, #30363d)',
    borderRadius: '8px', color: 'var(--text-primary, #e6edf3)',
    fontSize: '0.95rem', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.9rem', fontWeight: '600',
    marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)',
  };

  const appTypes: { value: AppType; label: string; icon: string; desc: string }[] = [
    { value: 'WEB', label: 'Web Application', icon: '\uD83C\uDF10', desc: 'Traditional server-rendered web app' },
    { value: 'SPA', label: 'Single Page App', icon: '\u26A1', desc: 'Client-side rendered application' },
    { value: 'NATIVE_MOBILE', label: 'Mobile App', icon: '\uD83D\uDCF1', desc: 'iOS or Android native app' },
    { value: 'NATIVE_DESKTOP', label: 'Desktop App', icon: '\uD83D\uDDA5\uFE0F', desc: 'Native desktop application' },
    { value: 'M2M', label: 'Machine-to-Machine', icon: '\u2699\uFE0F', desc: 'Backend service or API' },
  ];

  // Show secret after creation
  if (createdSecret) {
    return (
      <div style={{
        minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'var(--bg-primary, #0f1419)', color: 'var(--text-primary, #e6edf3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
      }}>
        <div style={{
          background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)',
          borderRadius: '16px', padding: '2.5rem', maxWidth: '600px', width: '100%', textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#9989;</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Application Created!</h1>
          <p style={{ color: 'var(--text-secondary, #7d8590)', marginBottom: '2rem' }}>
            Save your client secret now. It will not be shown again.
          </p>

          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ ...labelStyle, color: '#fca5a5', fontSize: '0.8rem' }}>CLIENT SECRET (save this now!)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <code style={{
                flex: 1, padding: '0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px',
                fontSize: '0.8rem', wordBreak: 'break-all', textAlign: 'left', color: '#e6edf3'
              }}>
                {createdSecret}
              </code>
              <button onClick={() => copyToClipboard(createdSecret)} style={{
                padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color, #30363d)', borderRadius: '8px',
                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', flexShrink: 0
              }}>Copy</button>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard/applications')}
            style={{
              padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '1rem', fontWeight: '600'
            }}
          >
            Go to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'var(--bg-primary, #0f1419)', color: 'var(--text-primary, #e6edf3)'
    }}>
      <header style={{
        background: 'var(--bg-card, #161b22)', borderBottom: '1px solid var(--border-color, #30363d)',
        padding: '1.25rem 2rem', position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.push('/dashboard/applications')} style={{
            background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color, #30363d)',
            borderRadius: '8px', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '1.1rem',
            color: 'var(--text-secondary, #7d8590)'
          }}>&#8592;</button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>New Application</h1>
        </div>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* App Type Selection */}
          <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Application Type</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {appTypes.map((at) => (
                <button
                  key={at.value}
                  type="button"
                  onClick={() => setType(at.value)}
                  style={{
                    background: type === at.value ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-primary, #0f1419)',
                    border: `2px solid ${type === at.value ? '#6366f1' : 'var(--border-color, #30363d)'}`,
                    borderRadius: '10px', padding: '1rem', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s', color: 'inherit'
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{at.icon}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.25rem' }}>{at.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #7d8590)' }}>{at.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Basic Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Application Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="My Application" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your application" rows={2}
                  style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Redirect URIs * (one per line)</label>
                <textarea value={redirectUris} onChange={(e) => setRedirectUris(e.target.value)}
                  placeholder="https://myapp.com/callback" rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }} />
              </div>
              <div>
                <label style={labelStyle}>Allowed Origins (one per line)</label>
                <textarea value={allowedOrigins} onChange={(e) => setAllowedOrigins(e.target.value)}
                  placeholder="https://myapp.com" rows={2}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '0.85rem',
              background: submitting ? '#4b5563' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none', borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '1rem', fontWeight: '600',
              boxShadow: submitting ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
          >
            {submitting ? 'Creating...' : 'Create Application'}
          </button>
        </form>
      </main>
    </div>
  );
}
