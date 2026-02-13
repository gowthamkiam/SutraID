'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Plus,
  CheckCircle,
  UserCheck,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import { policyApi, passwordPolicyApi, Policy } from '@/lib/api';

type PolicyTab = 'SIGN_ON' | 'PASSWORD';

export default function SecurityPoliciesPage() {
  const [activeTab, setActiveTab] = useState<PolicyTab>('SIGN_ON');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // State for data
  const [signOnPolicies, setSignOnPolicies] = useState<Policy[]>([]);
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    lockoutThreshold: 5,
    lockoutDuration: 30,
  });

  // Mock org ID for demonstration
  const orgId = "org_sutraid_enterprise_demo";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [policies, pwPolicy] = await Promise.all([
        policyApi.listByType(orgId, 'SIGN_ON'),
        passwordPolicyApi.get(orgId)
      ]);
      setSignOnPolicies(policies);
      if (pwPolicy) {
        setPasswordPolicy({
          minLength: pwPolicy.minLength,
          requireUppercase: pwPolicy.requireUppercase,
          requireLowercase: pwPolicy.requireLowercase,
          requireNumbers: pwPolicy.requireNumbers,
          requireSymbols: pwPolicy.requireSymbols,
          lockoutThreshold: pwPolicy.lockoutThreshold,
          lockoutDuration: pwPolicy.lockoutDuration,
        });
      }
    } catch (err) {
      console.error('Failed to fetch policies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePolicy = async () => {
    setLoading(true);
    try {
      await policyApi.create(orgId, {
        name: 'New Custom Policy ' + (signOnPolicies.length + 1),
        description: 'Custom sign-on rules',
        effect: 'ALLOW',
        resource: 'auth:login',
        actions: ['login'],
        // @ts-ignore
        type: 'SIGN_ON',
        priority: 5,
        enabled: true,
        rules: [
          {
            id: 'rule_new',
            name: 'MFA for Remote',
            conditions: { group: 'Remote Employees' },
            requirement: 'MFA_REQUIRED',
            priority: 1
          }
        ]
      });
      await fetchData();
      setMessage('New policy created successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('Error creating policy: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePasswordPolicy = async () => {
    setLoading(true);
    try {
      await passwordPolicyApi.update(orgId, passwordPolicy);
      setMessage('Password policy updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('Error saving policy: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e5e7eb',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '4rem 2rem',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.1)',
              color: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={24} />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Security Policies
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px' }}>
            Configure enterprise-grade authentication rules and password complexity requirements.
          </p>
        </header>

        {/* Tabs - Pill Style */}
        <div style={{
          display: 'flex',
          background: '#fff',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem',
          width: 'fit-content'
        }}>
          <button
            onClick={() => setActiveTab('SIGN_ON')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'SIGN_ON' ? '#6366f1' : 'transparent',
              color: activeTab === 'SIGN_ON' ? '#fff' : '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <UserCheck size={18} /> Sign-on & MFA
          </button>
          <button
            onClick={() => setActiveTab('PASSWORD')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'PASSWORD' ? '#6366f1' : 'transparent',
              color: activeTab === 'PASSWORD' ? '#fff' : '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Lock size={18} /> Password Complexity
          </button>
        </div>

        {message && (
          <div style={{
            padding: '1rem 1.25rem',
            background: '#f0fdf4',
            border: '1px solid #dcfce7',
            borderRadius: '12px',
            color: '#166534',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.95rem',
          }}>
            <CheckCircle size={18} />
            {message}
          </div>
        )}

        {loading && !signOnPolicies.length && !passwordPolicy.minLength && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <RefreshCcw className="animate-spin" size={32} />
            <p style={{ marginTop: '1rem' }}>Loading policies...</p>
          </div>
        )}

        {!loading && activeTab === 'SIGN_ON' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Sign-on Policies</h2>
              <button
                onClick={handleCreatePolicy}
                disabled={loading}
                style={{
                  padding: '0.6rem 1.2rem',
                  background: '#6366f1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: loading ? 0.7 : 1
                }}>
                <Plus size={18} /> New Policy
              </button>
            </div>

            {signOnPolicies.map((policy: any) => (
              <div key={policy.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{policy.name}</h3>
                      {policy.enabled && (
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '99px',
                          background: '#dcfce7',
                          color: '#166534',
                          fontSize: '0.7rem',
                          fontWeight: 700
                        }}>Active</span>
                      )}
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                      Priority {policy.priority} • {policy.description}
                    </p>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  {(policy.rules || []).map((rule: any, idx: number) => (
                    <div key={rule.id || idx} style={{
                      padding: '1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: idx < (policy.rules?.length || 0) - 1 ? '1px solid #e2e8f0' : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, width: '20px' }}>{idx + 1}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{rule.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            If group is <strong>{rule.conditions?.group || 'Any'}</strong> then <strong>{rule.requirement}</strong>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={18} color="#94a3b8" />
                    </div>
                  ))}
                  {(!policy.rules || policy.rules.length === 0) && (
                    <div style={{ padding: '1.25rem', color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      No rules defined.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === 'PASSWORD' && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Standard Password Policy</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>Minimum Length</label>
                <input
                  type="number"
                  value={passwordPolicy.minLength}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, minLength: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Complexity Requirements</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={passwordPolicy.requireUppercase} onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireUppercase: e.target.checked })} />
                  <span style={{ fontSize: '0.9rem', color: '#334155' }}>Require uppercase (A-Z)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={passwordPolicy.requireLowercase} onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireLowercase: e.target.checked })} />
                  <span style={{ fontSize: '0.9rem', color: '#334155' }}>Require lowercase (a-z)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={passwordPolicy.requireNumbers} onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireNumbers: e.target.checked })} />
                  <span style={{ fontSize: '0.9rem', color: '#334155' }}>Require numbers (0-9)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={passwordPolicy.requireSymbols} onChange={(e) => setPasswordPolicy({ ...passwordPolicy, requireSymbols: e.target.checked })} />
                  <span style={{ fontSize: '0.9rem', color: '#334155' }}>Require symbols (!@#$%)</span>
                </label>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '2rem 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>Lockout Threshold (Failures)</label>
                <input
                  type="number"
                  value={passwordPolicy.lockoutThreshold}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, lockoutThreshold: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>Lockout Duration (Minutes)</label>
                <input
                  type="number"
                  value={passwordPolicy.lockoutDuration}
                  onChange={(e) => setPasswordPolicy({ ...passwordPolicy, lockoutDuration: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }}
                />
              </div>
            </div>

            <button
              onClick={handleSavePasswordPolicy}
              disabled={loading}
              style={{
                marginTop: '2.5rem',
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading && <RefreshCcw className="animate-spin" size={18} />}
              Save Password Policy
            </button>
          </div>
        )}
      </div>
      <style jsx>{`
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .animate-spin {
                animation: spin 1.5s linear infinite;
            }
        `}</style>
    </div>
  );
}
