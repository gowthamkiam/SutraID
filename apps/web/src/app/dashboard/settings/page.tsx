'use client';

import { useEffect, useState } from 'react';
import { mfaApi, MfaStatus, EnrollTotpResponse } from '@/lib/api';

type EnrollmentStep = 'idle' | 'qr' | 'verify' | 'backup' | 'done';

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

  // Backup codes state
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  useEffect(() => {
    loadMfaStatus();
  }, []);

  const loadMfaStatus = async () => {
    try {
      const status = await mfaApi.getStatus();
      setMfaStatus(status);
    } catch (err: any) {
      setError(err.message);
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
      setEnrollStep('backup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrollLoading(false);
    }
  };

  const finishEnrollment = () => {
    setEnrollStep('done');
    setEnrollData(null);
    setVerifyCode('');
    setMessage('MFA has been enabled successfully!');
    loadMfaStatus();
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollLoading(true);
    setError('');
    try {
      await mfaApi.disable(disablePassword);
      setShowDisable(false);
      setDisablePassword('');
      setMessage('MFA has been disabled.');
      loadMfaStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setEnrollLoading(true);
    setError('');
    try {
      const result = await mfaApi.regenerateBackupCodes();
      setBackupCodes(result.backupCodes);
      setMessage('New backup codes generated. Save them securely!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrollLoading(false);
    }
  };

  const copyBackupCodes = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join('\n'));
    setMessage('Backup codes copied to clipboard!');
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card, #fff)',
    borderRadius: '12px',
    border: '1px solid var(--border-color, #e5e7eb)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  const btnPrimary: React.CSSProperties = {
    padding: '0.6rem 1.5rem',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const btnSecondary: React.CSSProperties = {
    padding: '0.6rem 1.5rem',
    background: '#fff',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
  };

  const btnDanger: React.CSSProperties = {
    padding: '0.6rem 1.5rem',
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #f9fafb)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.85rem' }}>
          ← Back to Dashboard
        </a>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary, #111827)', margin: '0.5rem 0 0.25rem' }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '0.9rem', margin: '0 0 2rem' }}>
          Manage your account security settings
        </p>

        {/* Messages */}
        {message && (
          <div style={{
            padding: '0.75rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0',
            borderRadius: '10px', color: '#065f46', fontSize: '0.9rem', marginBottom: '1rem',
          }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{
            padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '10px', color: '#991b1b', fontSize: '0.9rem', marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading...</div>
        ) : (
          <>
            {/* MFA Status Card */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#111827', margin: 0 }}>
                    Two-Factor Authentication
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                    Add an extra layer of security to your account
                  </p>
                </div>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: mfaStatus?.enabled ? '#ecfdf5' : '#f3f4f6',
                  color: mfaStatus?.enabled ? '#065f46' : '#6b7280',
                }}>
                  {mfaStatus?.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              {/* MFA Methods List */}
              {mfaStatus?.enabled && mfaStatus.methods.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  {mfaStatus.methods.map((method) => (
                    <div key={method.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', marginBottom: '0.5rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🔐</span>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#111827' }}>{method.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                            {method.backupCodesRemaining} backup codes remaining
                            {method.lastUsedAt && ` · Last used ${new Date(method.lastUsedAt).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {!mfaStatus?.enabled && enrollStep === 'idle' && (
                  <button
                    onClick={startEnrollment}
                    disabled={enrollLoading}
                    style={btnPrimary}
                  >
                    {enrollLoading ? 'Setting up...' : 'Enable MFA'}
                  </button>
                )}
                {mfaStatus?.enabled && (
                  <>
                    <button onClick={handleRegenerateBackupCodes} disabled={enrollLoading} style={btnSecondary}>
                      Regenerate Backup Codes
                    </button>
                    <button onClick={() => setShowDisable(true)} style={btnDanger}>
                      Disable MFA
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Enrollment: QR Code Step */}
            {enrollStep === 'qr' && enrollData && (
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem' }}>
                  Step 1: Scan QR Code
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
                </p>

                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <img
                    src={enrollData.qrCodeDataUrl}
                    alt="TOTP QR Code"
                    style={{ width: '200px', height: '200px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    Or enter this secret manually:
                  </p>
                  <div style={{
                    padding: '0.75rem',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    wordBreak: 'break-all',
                    color: '#111827',
                    userSelect: 'all',
                  }}>
                    {enrollData.secret}
                  </div>
                </div>

                <button
                  onClick={() => setEnrollStep('verify')}
                  style={btnPrimary}
                >
                  Next: Verify Code
                </button>
              </div>
            )}

            {/* Enrollment: Verify Step */}
            {enrollStep === 'verify' && (
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem' }}>
                  Step 2: Verify Code
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Enter the 6-digit code from your authenticator app to verify setup.
                </p>

                <form onSubmit={handleVerifyEnrollment}>
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '10px',
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      letterSpacing: '0.5em',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: '1rem',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="submit" disabled={enrollLoading || verifyCode.length !== 6} style={{
                      ...btnPrimary,
                      opacity: verifyCode.length !== 6 ? 0.5 : 1,
                    }}>
                      {enrollLoading ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnrollStep('qr')}
                      style={btnSecondary}
                    >
                      Back
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Enrollment: Backup Codes Step */}
            {enrollStep === 'backup' && enrollData && (
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem' }}>
                  Step 3: Save Backup Codes
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Save these backup codes in a secure place. Each code can only be used once.
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}>
                  {enrollData.backupCodes.map((code, i) => (
                    <div key={i} style={{
                      fontFamily: 'monospace',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: '#111827',
                      padding: '0.25rem 0.5rem',
                    }}>
                      {code}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => copyBackupCodes(enrollData.backupCodes)}
                    style={btnSecondary}
                  >
                    Copy Codes
                  </button>
                  <button onClick={finishEnrollment} style={btnPrimary}>
                    Done
                  </button>
                </div>
              </div>
            )}

            {/* Disable MFA Dialog */}
            {showDisable && (
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#991b1b', margin: '0 0 0.5rem' }}>
                  Disable Two-Factor Authentication
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Enter your password to confirm disabling MFA. This will remove the extra layer of security from your account.
                </p>

                <form onSubmit={handleDisableMfa}>
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1.5px solid #d1d5db',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: '1rem',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="submit" disabled={enrollLoading} style={btnDanger}>
                      {enrollLoading ? 'Disabling...' : 'Disable MFA'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowDisable(false); setDisablePassword(''); }}
                      style={btnSecondary}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Regenerated Backup Codes Display */}
            {backupCodes && (
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#111827', margin: '0 0 0.5rem' }}>
                  New Backup Codes
                </h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Your old codes have been invalidated. Save these new codes securely.
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}>
                  {backupCodes.map((code, i) => (
                    <div key={i} style={{
                      fontFamily: 'monospace',
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: '#111827',
                      padding: '0.25rem 0.5rem',
                    }}>
                      {code}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => copyBackupCodes(backupCodes)} style={btnSecondary}>
                    Copy Codes
                  </button>
                  <button onClick={() => setBackupCodes(null)} style={btnPrimary}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
