'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Plus,
  CheckCircle,
  UserCheck,
  ChevronRight,
  ChevronDown,
  RefreshCcw,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { policyApi, passwordPolicyApi, Policy } from '@/lib/api';

type PolicyTab = 'SIGN_ON' | 'PASSWORD';

export default function SecurityPoliciesPage() {
  const [activeTab, setActiveTab] = useState<PolicyTab>('SIGN_ON');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Data State
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

  // UI State
  const [expandedPolicies, setExpandedPolicies] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
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

  // --- Actions ---

  const togglePolicy = (id: string) => {
    const newExpanded = new Set(expandedPolicies);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPolicies(newExpanded);
  };

  const openNewPolicyModal = () => {
    setEditingPolicy(null);
    setFormData({ name: '', description: '', enabled: true });
    setIsModalOpen(true);
  };

  const openEditPolicyModal = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description || '',
      enabled: policy.enabled !== false,
    });
    setIsModalOpen(true);
  };

  const handleSavePolicy = async () => {
    setLoading(true);
    try {
      if (editingPolicy) {
        // Update existing
        await policyApi.update(orgId, editingPolicy.id, {
          ...formData,
        });
        setMessage('Policy updated successfully.');
      } else {
        // Create new
        await policyApi.create(orgId, {
          name: formData.name,
          description: formData.description,
          effect: 'ALLOW',
          resource: 'auth:login',
          actions: ['login'],
          // @ts-ignore
          type: 'SIGN_ON',
          priority: 5,
          enabled: formData.enabled,
          rules: [
            {
              id: 'rule_new_' + Date.now(),
              name: 'MFA for Remote',
              conditions: { group: 'Remote Employees' },
              requirement: 'MFA_REQUIRED',
              priority: 1
            }
          ]
        });
        setMessage('New policy created successfully.');
      }
      setIsModalOpen(false);
      await fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('Error saving policy: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    setLoading(true);
    try {
      await policyApi.delete(orgId, id);
      setMessage('Policy deleted successfully.');
      await fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('Error deleting policy: ' + err.message);
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
      position: 'relative'
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
                onClick={openNewPolicyModal}
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
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => togglePolicy(policy.id)}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => openEditPolicyModal(policy)}
                      style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                    {!policy.name.includes('Default') && (
                      <button
                        onClick={() => handleDeletePolicy(policy.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', padding: '0.5rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => togglePolicy(policy.id)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem' }}
                    >
                      {expandedPolicies.has(policy.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </button>
                  </div>
                </div>

                {expandedPolicies.has(policy.id) && (
                  <div style={{ background: '#f8fafc', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease-in-out' }}>
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
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                          Priority: {rule.priority}
                        </div>
                      </div>
                    ))}
                    {(!policy.rules || policy.rules.length === 0) && (
                      <div style={{ padding: '1.25rem', color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        No rules defined.
                      </div>
                    )}
                  </div>
                )}
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

        {/* Create/Edit Policy Modal */}
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '2.5rem',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              animation: 'slideUp 0.3s ease-out'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editingPolicy ? 'Edit Policy' : 'New Policy'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Policy Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                    placeholder="e.g., Contractors Access"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none' }}
                    placeholder="Access rules for contractors"
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  <span style={{ fontSize: '1rem', color: '#334155' }}>Enable this policy immediately</span>
                </label>

                {!editingPolicy && (
                  <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>
                    <strong style={{ color: '#475569' }}>Note:</strong> A default "MFA for Remote" rule will be added automatically. You can edit specific rules after creating the policy.
                  </div>
                )}

                <button
                  onClick={handleSavePolicy}
                  disabled={loading || !formData.name}
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: !formData.name ? 0.5 : 1
                  }}
                >
                  {loading ? 'Saving...' : (editingPolicy ? 'Update Policy' : 'Create Policy')}
                </button>
              </div>
            </div>
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
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `}</style>
    </div>
  );
}
