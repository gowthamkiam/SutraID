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
  const [members, setMembers] = useState<MemberData[]>([
    { email: '', role: 'DEVELOPER' },
  ]);

  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);
  const [createdApp, setCreatedApp] = useState<any>(null);

  // We will auto-generate slug in the onChange handler for the name below

  const handleCreateOrganization = async () => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('sutraid_access_token') || localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${apiUrl}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(orgData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create organization');
      }

      const org = await response.json();
      setCreatedOrgId(org.id);
      localStorage.setItem('currentOrgId', org.id);
      setCurrentStep('application');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async () => {
    if (!createdOrgId) return;

    setLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      const response = await fetch(`${apiUrl}/organizations/${createdOrgId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: appData.name,
          type: appData.type,
          redirectUris: appData.redirectUris.filter((uri) => uri.trim()),
          allowedOrigins: [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create application');
      }

      const app = await response.json();
      setCreatedApp(app);
      setCurrentStep('members');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMembers = async () => {
    if (!createdOrgId) return;

    setLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

      // Invite each member
      const invitePromises = members
        .filter((m) => m.email.trim())
        .map((member) =>
          fetch(`${apiUrl}/organizations/${createdOrgId}/members/invite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(member),
          })
        );

      await Promise.all(invitePromises);
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
                  onClick={handleCreateOrganization}
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
                  {loading ? 'Creating...' : 'Continue'}
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
                  onClick={() => setCurrentStep('members')}
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
                  onClick={handleCreateApplication}
                  disabled={!appData.name || loading}
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
                  onMouseEnter={(e) => { if (appData.name && !loading) e.currentTarget.style.background = '#4338ca'; }}
                  onMouseLeave={(e) => { if (appData.name && !loading) e.currentTarget.style.background = '#4f46e5'; }}
                >
                  {loading ? 'Creating...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Members */}
          {currentStep === 'members' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Invite your team
              </h2>
              <p style={{ color: '#666', marginBottom: '2rem' }}>
                Invite colleagues to collaborate (optional)
              </p>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {members.map((member, index) => (
                  <div
                    key={index}
                    style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem' }}
                  >
                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) => {
                        const newMembers = [...members];
                        newMembers[index].email = e.target.value;
                        setMembers(newMembers);
                      }}
                      placeholder="colleague@example.com"
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
                    <select
                      value={member.role}
                      onChange={(e) => {
                        const newMembers = [...members];
                        newMembers[index].role = e.target.value as any;
                        setMembers(newMembers);
                      }}
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
                      <option value="ADMIN">Admin</option>
                      <option value="DEVELOPER">Developer</option>
                      <option value="MEMBER">Member</option>
                    </select>
                    {members.length > 1 && (
                      <button
                        onClick={() => setMembers(members.filter((_, i) => i !== index))}
                        style={{
                          padding: '0 0.875rem',
                          background: '#fff',
                          color: '#991b1b',
                          border: '1.5px solid #fecaca',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => setMembers([...members, { email: '', role: 'DEVELOPER' }])}
                  style={{
                    padding: '0.875rem',
                    background: '#fff',
                    color: '#374151',
                    border: '1.5px dashed #d1d5db',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#9ca3af';
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  + Add another member
                </button>
              </div>

              <div
                style={{
                  marginTop: '2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={() => setCurrentStep('complete')}
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
                  onClick={handleInviteMembers}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 2rem',
                    background: loading ? '#9ca3af' : '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#4338ca'; }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#4f46e5'; }}
                >
                  {loading ? 'Inviting...' : 'Send Invitations'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 'complete' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '600', marginBottom: '1rem' }}>
                You're all set!
              </h2>
              <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}>
                Your organization has been created successfully
              </p>

              {createdApp && (
                <div
                  style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    textAlign: 'left',
                  }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Application Credentials
                  </h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div>
                      <span style={{ color: '#666', fontSize: '0.85rem' }}>Client ID:</span>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.9rem',
                          padding: '0.5rem',
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          marginTop: '0.25rem',
                        }}
                      >
                        {createdApp.clientId}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#666', fontSize: '0.85rem' }}>Client Secret:</span>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.9rem',
                          padding: '0.5rem',
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          marginTop: '0.25rem',
                        }}
                      >
                        {createdApp.clientSecret}
                      </div>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: '#991b1b',
                      marginTop: '1rem',
                      background: '#fef2f2',
                      padding: '0.75rem',
                      borderRadius: '4px',
                    }}
                  >
                    ⚠️ Save these credentials now. The client secret won't be shown again.
                  </p>
                </div>
              )}

              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#4338ca'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#4f46e5'}
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
