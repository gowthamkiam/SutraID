'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ApplicationType = 'WEB' | 'SPA' | 'NATIVE_MOBILE' | 'M2M';

interface CreateApplicationRequest {
  name: string;
  description?: string;
  type: ApplicationType;
  redirectUris: string[];
  allowedOrigins?: string[];
  logoUrl?: string;
}

const appTypes = [
  {
    type: 'WEB' as ApplicationType,
    name: 'Web Application',
    icon: '🌐',
    description: 'Traditional server-side web applications with secure backend',
    color: '#6366f1',
  },
  {
    type: 'SPA' as ApplicationType,
    name: 'Single Page App',
    icon: '⚡',
    description: 'React, Vue, Angular apps running in the browser',
    color: '#8b5cf6',
  },
  {
    type: 'NATIVE_MOBILE' as ApplicationType,
    name: 'Native Mobile',
    icon: '📱',
    description: 'iOS, Android, or other native mobile applications',
    color: '#22d3ee',
  },
  {
    type: 'M2M' as ApplicationType,
    name: 'Machine to Machine',
    icon: '🤖',
    description: 'Backend services, APIs, and automation scripts',
    color: '#10b981',
  },
];

export default function NewApplicationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdApp, setCreatedApp] = useState<any>(null);

  const [orgId, setOrgId] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<CreateApplicationRequest>({
    name: '',
    description: '',
    type: 'WEB',
    redirectUris: [''],
    allowedOrigins: [''],
    logoUrl: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('currentOrgId');
    if (stored) {
      setOrgId(stored);
    } else {
      // Fetch user's first org
      const accessToken = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      fetch(`${apiUrl}/organizations`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((orgs) => {
          if (orgs && orgs.length > 0) {
            setOrgId(orgs[0].id);
            localStorage.setItem('currentOrgId', orgs[0].id);
          } else {
            setError('No organization found. Please complete onboarding first.');
          }
        })
        .catch(() => {
          setError('Failed to load organization. Please log in again.');
        });
    }
  }, []);

  const handleCreateApplication = async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      setError(null);

      const accessToken = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      // Clean up empty strings from arrays
      const payload = {
        ...formData,
        redirectUris: formData.redirectUris.filter((uri) => uri.trim() !== ''),
        allowedOrigins: formData.allowedOrigins?.filter((origin) => origin.trim() !== '') || [],
        description: formData.description?.trim() || undefined,
        logoUrl: formData.logoUrl?.trim() || undefined,
      };

      const response = await fetch(`${apiUrl}/organizations/${orgId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create application');
      }

      const data = await response.json();
      setCreatedApp(data);
      setStep(4); // Success step
    } catch (err: any) {
      setError(err.message || 'Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  const addRedirectUri = () => {
    setFormData({ ...formData, redirectUris: [...formData.redirectUris, ''] });
  };

  const removeRedirectUri = (index: number) => {
    setFormData({
      ...formData,
      redirectUris: formData.redirectUris.filter((_, i) => i !== index),
    });
  };

  const updateRedirectUri = (index: number, value: string) => {
    const newUris = [...formData.redirectUris];
    newUris[index] = value;
    setFormData({ ...formData, redirectUris: newUris });
  };

  const addAllowedOrigin = () => {
    setFormData({
      ...formData,
      allowedOrigins: [...(formData.allowedOrigins || []), ''],
    });
  };

  const removeAllowedOrigin = (index: number) => {
    setFormData({
      ...formData,
      allowedOrigins: formData.allowedOrigins?.filter((_, i) => i !== index),
    });
  };

  const updateAllowedOrigin = (index: number, value: string) => {
    const newOrigins = [...(formData.allowedOrigins || [])];
    newOrigins[index] = value;
    setFormData({ ...formData, allowedOrigins: newOrigins });
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.name.trim() !== '';
    }
    if (step === 3) {
      return formData.redirectUris.some((uri) => uri.trim() !== '');
    }
    return true;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0f1419)', color: 'var(--text-primary, #e6edf3)', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => router.push('/dashboard/applications')}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary, #8b949e)',
              border: 'none',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.5rem',
              borderRadius: '6px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
              e.currentTarget.style.color = '#6366f1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary, #8b949e)';
            }}
          >
            <span>←</span>
            <span>Back to Applications</span>
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
            Create New Application
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary, #8b949e)' }}>
            Configure an application to use SutraID for authentication
          </p>
        </div>

        {/* Progress Steps */}
        {step < 4 && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', justifyContent: 'center' }}>
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: step >= stepNum ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'var(--bg-card, #161b22)',
                    border: step >= stepNum ? 'none' : '1px solid var(--border-color, #30363d)',
                    color: step >= stepNum ? '#fff' : 'var(--text-secondary, #8b949e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  {step > stepNum ? '✓' : stepNum}
                </div>
                {stepNum < 3 && (
                  <div
                    style={{
                      width: '60px',
                      height: '2px',
                      background: step > stepNum ? 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)' : 'var(--border-color, #30363d)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div style={{ background: 'var(--bg-card, #161b22)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '2rem' }}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Basic Information
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '2rem' }}>
                Give your application a name and description
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
                  Application Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Awesome App"
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary, #0f1419)',
                    border: '1px solid var(--border-color, #30363d)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: 'var(--text-primary, #e6edf3)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color, #30363d)')}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A brief description of your application..."
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary, #0f1419)',
                    border: '1px solid var(--border-color, #30363d)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: 'var(--text-primary, #e6edf3)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color, #30363d)')}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
                  Logo URL (Optional)
                </label>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  style={{
                    width: '100%',
                    background: 'var(--bg-primary, #0f1419)',
                    border: '1px solid var(--border-color, #30363d)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: 'var(--text-primary, #e6edf3)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color, #30363d)')}
                />
              </div>
            </div>
          )}

          {/* Step 2: Application Type */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Application Type
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '2rem' }}>
                Select the type that best matches your application
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {appTypes.map((appType) => (
                  <div
                    key={appType.type}
                    onClick={() => setFormData({ ...formData, type: appType.type })}
                    style={{
                      background: formData.type === appType.type ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-primary, #0f1419)',
                      border: `2px solid ${formData.type === appType.type ? appType.color : 'var(--border-color, #30363d)'}`,
                      borderRadius: '12px',
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (formData.type !== appType.type) {
                        e.currentTarget.style.borderColor = appType.color;
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (formData.type !== appType.type) {
                        e.currentTarget.style.borderColor = 'var(--border-color, #30363d)';
                        e.currentTarget.style.background = 'var(--bg-primary, #0f1419)';
                      }
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>
                      {appType.icon}
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: formData.type === appType.type ? appType.color : 'var(--text-primary, #e6edf3)', textAlign: 'center' }}>
                      {appType.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #8b949e)', lineHeight: '1.5', textAlign: 'center' }}>
                      {appType.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Configuration */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Configuration
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '2rem' }}>
                Configure redirect URIs and allowed origins
              </p>

              {/* Redirect URIs */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
                  Redirect URIs *
                </label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '1rem' }}>
                  Where users will be redirected after authentication
                </p>
                {formData.redirectUris.map((uri, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      value={uri}
                      onChange={(e) => updateRedirectUri(index, e.target.value)}
                      placeholder="https://example.com/callback"
                      style={{
                        flex: 1,
                        background: 'var(--bg-primary, #0f1419)',
                        border: '1px solid var(--border-color, #30363d)',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        color: 'var(--text-primary, #e6edf3)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color, #30363d)')}
                    />
                    {formData.redirectUris.length > 1 && (
                      <button
                        onClick={() => removeRedirectUri(index)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          fontSize: '1rem',
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addRedirectUri}
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  + Add Another URI
                </button>
              </div>

              {/* Allowed Origins */}
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--text-primary, #e6edf3)' }}>
                  Allowed Origins (Optional)
                </label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '1rem' }}>
                  Origins allowed to make requests (CORS)
                </p>
                {(formData.allowedOrigins || []).map((origin, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => updateAllowedOrigin(index, e.target.value)}
                      placeholder="https://example.com"
                      style={{
                        flex: 1,
                        background: 'var(--bg-primary, #0f1419)',
                        border: '1px solid var(--border-color, #30363d)',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        color: 'var(--text-primary, #e6edf3)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-color, #30363d)')}
                    />
                    <button
                      onClick={() => removeAllowedOrigin(index)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <button
                  onClick={addAllowedOrigin}
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  + Add Origin
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && createdApp && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem' }}>
                Application Created!
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '2rem' }}>
                Your application has been successfully created. Save your credentials below.
              </p>

              {/* Credentials Warning */}
              <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                  <strong style={{ color: '#fbbf24' }}>Important:</strong>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#fbbf24', margin: 0 }}>
                  Your client secret will only be shown once. Make sure to save it in a secure location.
                </p>
              </div>

              {/* Credentials */}
              <div style={{ background: 'var(--bg-primary, #0f1419)', border: '1px solid var(--border-color, #30363d)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '0.5rem' }}>
                    Client ID
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <code style={{ flex: 1, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'monospace', overflow: 'auto' }}>
                      {createdApp.clientId}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdApp.clientId);
                        alert('Copied to clipboard!');
                      }}
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: '#6366f1',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '6px',
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary, #8b949e)', marginBottom: '0.5rem' }}>
                    Client Secret (save this now!)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <code style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'monospace', overflow: 'auto' }}>
                      {createdApp.clientSecret}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdApp.clientSecret);
                        alert('Copied to clipboard!');
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => router.push(`/dashboard/applications/${createdApp.id}`)}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Configure Application
                </button>
                <button
                  onClick={() => router.push('/dashboard/applications')}
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Back to Applications
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 4 && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color, #30363d)' }}>
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  ← Back
                </button>
              )}
              <div style={{ flex: 1 }} />
              {step < 3 && (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed() || loading}
                  style={{
                    background: canProceed() && !loading ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'rgba(99, 102, 241, 0.3)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: canProceed() && !loading ? 'pointer' : 'not-allowed',
                  }}
                >
                  Next →
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleCreateApplication}
                  disabled={!canProceed() || loading}
                  style={{
                    background: canProceed() && !loading ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'rgba(99, 102, 241, 0.3)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: canProceed() && !loading ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loading ? 'Creating...' : 'Create Application'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
