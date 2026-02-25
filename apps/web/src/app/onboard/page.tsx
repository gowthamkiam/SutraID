'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

type Step = 'organization' | 'application' | 'members' | 'complete';

interface OrganizationData {
  name: string;
  slug: string;
  primaryColor: string;
}

interface ApplicationData {
  name: string;
  type: 'WEB' | 'SPA' | 'NATIVE_MOBILE' | 'M2M';
  redirectUris: string[];
}

interface MemberData {
  email: string;
  role: 'ADMIN' | 'DEVELOPER' | 'MEMBER';
}

export default function OnboardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('organization');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [orgData, setOrgData] = useState<OrganizationData>({
    name: '',
    slug: '',
    primaryColor: '#000000',
  });
  const [appData, setAppData] = useState<ApplicationData>({
    name: '',
    type: 'WEB',
    redirectUris: [''],
  });
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [skipApplication, setSkipApplication] = useState<boolean>(false);

  // We will auto-generate slug in the onChange handler for the name below

  const handleVerifyOrganizationSlug = async () => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('sutraid_access_token') || localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${apiUrl}/auth/org-lookup/${encodeURIComponent(orgData.slug)}`);

      if (response.ok) {
        throw new Error('Organization slug is already taken');
      }

      setCurrentStep('application');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueApplication = (skip: boolean) => {
    setSkipApplication(skip);
    setCurrentStep('members');
  };

  const handleSubmitOnboarding = async () => {
    if (!adminEmail.trim()) {
      setError('Admin email is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const payload = {
        organization: orgData,
        application: skipApplication ? undefined : {
          name: appData.name,
          type: appData.type,
          redirectUris: appData.redirectUris.filter((uri) => uri.trim()),
        },
        adminEmail: adminEmail.trim(),
      };

      const response = await fetch(`${apiUrl}/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to complete onboarding');
      }

      // Automatically store the org ID if needed, though they need to click the magic link
      // A magic link is already dispatched independently.
      setCurrentStep('complete');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'organization', label: 'Organization', number: 1 },
      { key: 'application', label: 'Application', number: 2 },
      { key: 'members', label: 'Team', number: 3 },
      { key: 'complete', label: 'Complete', number: 4 },
    ];

    const currentIndex = steps.findIndex((s) => s.key === currentStep);

    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
        {steps.map((step, index) => (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: index <= currentIndex ? '#4f46e5' : 'rgba(255, 255, 255, 0.1)',
                color: index <= currentIndex ? '#fff' : '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '0.9rem',
                border: index <= currentIndex ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {step.number}
            </div>
            {index < steps.length - 1 && (
              <div
                style={{
                  width: '80px',
                  height: '2px',
                  background: index < currentIndex ? '#4f46e5' : 'rgba(255, 255, 255, 0.1)',
                  margin: '0 0.5rem',
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
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
      <div style={{ maxWidth: '600px', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Header */}
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
            Let's get your organization set up
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Content Card */}
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

          {/* Step 1: Organization */}
          {currentStep === 'organization' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Create your organization
              </h2>
              <p style={{ color: '#666', marginBottom: '2rem' }}>
                This will be the workspace for your team
              </p>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
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
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={orgData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setOrgData({
                        ...orgData,
                        name: newName,
                        slug: newName
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '')
                      });
                    }}
                    placeholder="Acme Inc"
                    style={{ ...inputStyle }}
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
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    value={orgData.slug}
                    onChange={(e) => setOrgData({ ...orgData, slug: e.target.value })}
                    placeholder="acme-inc"
                    style={{ ...inputStyle, fontFamily: 'monospace' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#4f46e5';
                      e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    This will be used in URLs (lowercase letters, numbers, and hyphens only)
                  </p>
                </div>

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
                    Brand Color
                  </label>
                  <input
                    type="color"
                    value={orgData.primaryColor}
                    onChange={(e) => setOrgData({ ...orgData, primaryColor: e.target.value })}
                    style={{
                      width: '100px',
                      height: '50px',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      padding: '0.2rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleVerifyOrganizationSlug}
                  disabled={!orgData.name || !orgData.slug || loading}
                  style={{
                    padding: '0.75rem 2rem',
                    background: orgData.name && orgData.slug ? '#4f46e5' : '#9ca3af',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: orgData.name && orgData.slug ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { if (orgData.name && orgData.slug && !loading) e.currentTarget.style.background = '#4338ca'; }}
                  onMouseLeave={(e) => { if (orgData.name && orgData.slug && !loading) e.currentTarget.style.background = '#4f46e5'; }}
                >
                  {loading ? 'Checking...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Application */}
          {currentStep === 'application' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Create your first application
              </h2>
              <p style={{ color: '#666', marginBottom: '2rem' }}>
                Register an app that will use SutraID for authentication (optional)
              </p>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
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
                    Application Name
                  </label>
                  <input
                    type="text"
                    value={appData.name}
                    onChange={(e) => setAppData({ ...appData, name: e.target.value })}
                    placeholder="My Web App"
                    style={{ ...inputStyle }}
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
                    Application Type
                  </label>
                  <select
                    value={appData.type}
                    onChange={(e) =>
                      setAppData({ ...appData, type: e.target.value as any })
                    }
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#4f46e5';
                      e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <option value="WEB">Web Application</option>
                    <option value="SPA">Single-Page Application</option>
                    <option value="NATIVE_MOBILE">Mobile App</option>
                    <option value="M2M">Machine-to-Machine</option>
                  </select>
                </div>

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
                    Redirect URI
                  </label>
                  <input
                    type="url"
                    value={appData.redirectUris[0]}
                    onChange={(e) =>
                      setAppData({ ...appData, redirectUris: [e.target.value] })
                    }
                    placeholder="http://localhost:3000/callback"
                    style={{ ...inputStyle }}
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
              </div>

              <div
                style={{
                  marginTop: '2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={() => handleContinueApplication(true)}
                  style={{
                    padding: '0.75rem 2rem',
                    background: '#fff',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '50px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                >
                  Skip for now
                </button>
                <button
                  onClick={() => handleContinueApplication(false)}
                  disabled={!appData.name}
                  style={{
                    padding: '0.75rem 2rem',
                    background: appData.name ? '#4f46e5' : '#9ca3af',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: appData.name ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { if (appData.name) e.currentTarget.style.background = '#4338ca'; }}
                  onMouseLeave={(e) => { if (appData.name) e.currentTarget.style.background = '#4f46e5'; }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Members */}
          {currentStep === 'members' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Setup Administrator
              </h2>
              <p style={{ color: '#666', marginBottom: '2rem' }}>
                Enter the email address for the initial organization administrator.
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
                  onClick={handleSubmitOnboarding}
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
                  {loading ? 'Creating...' : 'Finish Setup'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 'complete' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✉️</div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '600', marginBottom: '1rem' }}>
                Check your email!
              </h2>
              <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
                We've sent a magic link to <strong>{adminEmail}</strong>.
              </p>
              <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
                Click the link in the email to automatically verify your account and access your new dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
