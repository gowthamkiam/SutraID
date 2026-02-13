'use client';

import { useEffect, useState } from 'react';
import { mfaApi, MfaStatus, EnrollTotpResponse, MfaMethod } from '@/lib/api';

type EnrollmentStep = 'idle' | 'qr' | 'verify' | 'done';

export default function SettingsPage() {
  const [mfaStatus, setMfaStatus] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Enrollment state
  const [enrollStep, setEnrollStep] = useState<EnrollmentStep>('idle');
  const [enrollData, setEnrollData] = useState<EnrollTotpResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Disable MFA state
  const [showDisable, setShowDisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  useEffect(() => {
    loadMfaStatus();
  }, []);

  const loadMfaStatus = async () => {
    try {
      const status = await mfaApi.getStatus();
      setMfaStatus(status);
    } catch (err: any) {
      console.error('Failed to load MFA status:', err);
      setError('Failed to load security settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    setEnrollLoading(true);
    setError('');
    try {
      const data = await mfaApi.enrollTotp();
      setEnrollData(data);
      setEnrollStep('qr');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData) return;
    setEnrollLoading(true);
    setError('');
    try {
      await mfaApi.verifyEnrollment(enrollData.methodId, verifyCode);
      setEnrollStep('done');
      setEnrollData(null);
      setVerifyCode('');
      setMessage('Authenticator app linked successfully!');
      loadMfaStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handlePasskeyEnroll = async () => {
    setEnrollLoading(true);
    setError('');
    setMessage('');
    try {
      const options = await mfaApi.getPasskeyOptions();

      // Convert challenge and user.id from base64url to BufferSource
      const createOptions: PublicKeyCredentialCreationOptions = {
        ...options as any,
        challenge: Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        user: {
          ...options.user,
          id: Uint8Array.from(atob(options.user.id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        },
      };

      const credential = await navigator.credentials.create({
        publicKey: createOptions
      }) as PublicKeyCredential;

      if (credential) {
        // Collect necessary fields for enrollment
        const response = credential.response as AuthenticatorAttestationResponse;
        const enrollmentData = {
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          type: credential.type,
          response: {
            attestationObject: btoa(String.fromCharCode(...new Uint8Array(response.attestationObject))),
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
          }
        };

        await mfaApi.enrollPasskey(enrollmentData);
        setMessage('Passkey registered successfully! You can now use it for phishing-resistant login.');
        loadMfaStatus();
      }
    } catch (err: any) {
      setError(err.message || 'Passkey enrollment failed. Your browser may not support it or you cancelled.');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollLoading(true);
    setError('');
    try {
      await mfaApi.disable(disablePassword);
      setShowDisable(false);
      setDisablePassword('');
      setMessage('MFA protection has been removed.');
      loadMfaStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrollLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e5e7eb',
    padding: '2.5rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  };

  const btnPrimary: React.CSSProperties = {
    padding: '0.875rem 1.75rem',
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
  };

  const btnSecondary: React.CSSProperties = {
    padding: '0.875rem 1.75rem',
    background: '#fff',
    color: '#374151',
    border: '1.5px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const btnDanger: React.CSSProperties = {
    padding: '0.875rem 1.75rem',
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '4rem 2rem',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        <a href="/dashboard" style={{
          color: '#6366f1',
          textDecoration: 'none',
          fontSize: '0.95rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          marginBottom: '2rem'
        }}>
          <span>←</span> Back to Dashboard
        </a>

        <header style={{ marginBottom: '3.5rem' }}>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.75rem', letterSpacing: '-0.025em' }}>
            Security Settings
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.15rem', maxWidth: '600px', lineHeight: 1.6 }}>
            Manage your authentication methods and protect your account with modern security standards.
          </p>
        </header>

        {/* Messages */}
        {message && (
          <div style={{
            padding: '1.25rem', background: '#f0fdf4', border: '1px solid #86efac',
            borderRadius: '16px', color: '#166534', fontSize: '1rem', marginBottom: '2rem',
            display: 'flex', alignItems: 'center', gap: '0.85rem', fontWeight: 500
          }}>
            <span style={{ fontSize: '1.4rem' }}>✓</span> {message}
          </div>
        )}
        {error && (
          <div style={{
            padding: '1.25rem', background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '16px', color: '#991b1b', fontSize: '1rem', marginBottom: '2rem',
            display: 'flex', alignItems: 'center', gap: '0.85rem', fontWeight: 500
          }}>
            <span style={{ fontSize: '1.4rem' }}>⚠</span> {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '6rem', color: '#64748b' }}>
            <div className="spinner" style={{ border: '4px solid #f1f5f9', borderTop: '4px solid #6366f1', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
            <p style={{ fontWeight: 500 }}>Syncing security credentials...</p>
          </div>
        ) : (
          <>
            {/* MFA Container */}
            <section style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    Multi-Factor Authentication
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '1rem', margin: '0.5rem 0 0' }}>
                    Phishing-resistant methods like Passkeys are recommended.
                  </p>
                </div>
                <div style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  background: mfaStatus?.enabled ? '#e0e7ff' : '#f1f5f9',
                  color: mfaStatus?.enabled ? '#4338ca' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: mfaStatus?.enabled ? '1px solid #c7d2fe' : '1px solid #e2e8f0'
                }}>
                  {mfaStatus?.enabled ? 'Active Protection' : 'Action Required'}
                </div>
              </div>

              {/* MFA Methods Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                {mfaStatus?.methods && mfaStatus.methods.length > 0 ? (
                  mfaStatus.methods.map((method) => (
                    <div key={method.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1.25rem 1.5rem', background: '#f8fafc', borderRadius: '16px',
                      border: '1px solid #f1f5f9', transition: 'all 0.2s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '12px', background: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9'
                        }}>
                          {method.type === 'PASSKEY' || method.type === 'FIDO2' ? '🔑' : '📱'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {method.name}
                            {method.isPhishingResistant && (
                              <span style={{
                                background: '#dcfce7', color: '#166534', fontSize: '0.75rem',
                                padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800,
                                textTransform: 'uppercase', letterSpacing: '0.02em'
                              }}>Secure</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                            {method.lastUsedAt ? `Last login ${new Date(method.lastUsedAt).toLocaleDateString()}` : 'New method registered'}
                          </div>
                        </div>
                      </div>
                      <button style={{
                        background: '#fff', border: '1.5px solid #f1f5f9', color: '#64748b',
                        padding: '0.5rem', borderRadius: '8px', cursor: 'pointer'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{
                    padding: '3rem 2rem', textAlign: 'center', background: '#f8fafc',
                    borderRadius: '16px', border: '2px dashed #e2e8f0'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}>🛡️</div>
                    <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500, margin: 0 }}>
                      Secure your account by adding an authentication factor.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handlePasskeyEnroll}
                  disabled={enrollLoading}
                  style={btnPrimary}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {enrollLoading ? 'Registering...' : 'Add Passkey (WebAuthn)'}
                </button>
                <button
                  onClick={startEnrollment}
                  disabled={enrollLoading}
                  style={btnSecondary}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
                >
                  Setup TOTP App
                </button>
                {mfaStatus?.enabled && (
                  <button onClick={() => setShowDisable(true)} style={btnDanger}>
                    Remove MFA
                  </button>
                )}
              </div>
            </section>

            {/* TOTP Modal-like Display */}
            {(enrollStep === 'qr' || enrollStep === 'verify') && enrollData && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
              }}>
                <div style={{ ...cardStyle, maxWidth: '500px', width: '95%', marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Authenticator Setup
                    </h3>
                    <button onClick={() => setEnrollStep('idle')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                  </div>

                  {enrollStep === 'qr' ? (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.5 }}>
                        Scan this code with Google Authenticator, Authy, or your favorite vault.
                      </p>
                      <div style={{
                        display: 'inline-block', padding: '1.5rem', background: '#fff',
                        borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                        marginBottom: '2rem'
                      }}>
                        <img
                          src={enrollData.qrCodeDataUrl}
                          alt="Verification QR Code"
                          style={{ width: '220px', height: '220px', display: 'block' }}
                        />
                      </div>
                      <button onClick={() => setEnrollStep('verify')} style={{ ...btnPrimary, width: '100%' }}>Continue to Verification</button>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyEnrollment}>
                      <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.5, textAlign: 'center' }}>
                        Enter the 6-digit code shown in your app to link your account.
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
                        <input
                          type="text"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000 000"
                          maxLength={6}
                          required
                          autoFocus
                          style={{
                            width: '240px',
                            padding: '1.25rem',
                            border: '2px solid #e2e8f0',
                            borderRadius: '16px',
                            fontSize: '2.5rem',
                            textAlign: 'center',
                            letterSpacing: '0.4em',
                            fontWeight: 800,
                            color: '#0f172a',
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                          }}
                        />
                      </div>
                      <button type="submit" disabled={enrollLoading || verifyCode.length !== 6} style={{
                        ...btnPrimary,
                        width: '100%',
                        opacity: verifyCode.length !== 6 ? 0.6 : 1,
                      }}>
                        {enrollLoading ? 'Confirming...' : 'Finish Setup'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Adaptive Authentication Card */}
            <section style={{ ...cardStyle, background: 'linear-gradient(to right, #ffffff, #f8fafc)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem'
                  }}>
                    ✨
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Adaptive Protection
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '1rem', margin: '0.4rem 0 0', lineHeight: 1.4 }}>
                      AI automatically challenges high-risk logins using device and location signals.
                    </p>
                  </div>
                </div>
                <div style={{
                  width: '64px',
                  height: '34px',
                  background: mfaStatus?.adaptiveAuthEnabled ? '#4f46e5' : '#e2e8f0',
                  borderRadius: '17px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: mfaStatus?.adaptiveAuthEnabled ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none'
                }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    background: '#fff',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '4px',
                    left: mfaStatus?.adaptiveAuthEnabled ? '34px' : '4px',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }} />
                </div>
              </div>
            </section>

            {/* Disable Confirmation */}
            {showDisable && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
              }}>
                <div style={{ ...cardStyle, maxWidth: '480px', width: '90%', marginBottom: 0 }}>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                      width: '64px', height: '64px', background: '#fee2e2', color: '#ef4444',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem', margin: '0 auto 1.5rem'
                    }}>⚠️</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.75rem' }}>
                      Disable Shield?
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6 }}>
                      Disabling MFA reduces your account security significantly. Please enter your password to acknowledge the risk.
                    </p>
                  </div>
                  <form onSubmit={handleDisableMfa}>
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Enter password to confirm"
                      required
                      style={{
                        width: '100%', padding: '1.1rem', border: '2px solid #f1f5f9',
                        borderRadius: '14px', marginBottom: '2rem', fontSize: '1rem',
                        background: '#f8fafc', outline: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" style={{ ...btnDanger, flex: 2, background: '#ef4444', color: '#fff' }}>I understand, disable</button>
                      <button type="button" onClick={() => setShowDisable(false)} style={{ ...btnSecondary, flex: 1 }}>Go back</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
