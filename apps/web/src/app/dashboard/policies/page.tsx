'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { policyApi, Policy, CreatePolicyDto, OrgRole } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { hasPermission } from '@/lib/permissions';

const effectColors: Record<string, { bg: string; text: string; border: string }> = {
  ALLOW: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  DENY: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
};

export default function PoliciesPage() {
  const { role: orgRole } = useAuth();
  const canCreate = hasPermission(orgRole as OrgRole, 'policies:create');
  const canUpdate = hasPermission(orgRole as OrgRole, 'policies:update');
  const canDelete = hasPermission(orgRole as OrgRole, 'policies:delete');

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEffect, setFormEffect] = useState<'ALLOW' | 'DENY'>('ALLOW');
  const [formResource, setFormResource] = useState('');
  const [formActions, setFormActions] = useState('');
  const [formPriority, setFormPriority] = useState('0');
  const [formConditions, setFormConditions] = useState('{}');

  // Test evaluation
  const [showEval, setShowEval] = useState(false);
  const [evalResource, setEvalResource] = useState('');
  const [evalAction, setEvalAction] = useState('');
  const [evalResult, setEvalResult] = useState<any>(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const data = await policyApi.list();
      setPolicies(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormEffect('ALLOW');
    setFormResource('');
    setFormActions('');
    setFormPriority('0');
    setFormConditions('{}');
    setEditingId(null);
    setShowCreate(false);
  };

  const openEdit = (policy: Policy) => {
    setFormName(policy.name);
    setFormDescription(policy.description || '');
    setFormEffect(policy.effect);
    setFormResource(policy.resource);
    setFormActions(policy.actions.join(', '));
    setFormPriority(String(policy.priority));
    setFormConditions(JSON.stringify(policy.conditions, null, 2));
    setEditingId(policy.id);
    setShowCreate(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let conditions = {};
    try {
      conditions = JSON.parse(formConditions);
    } catch {
      setError('Invalid JSON in conditions');
      return;
    }

    const data: CreatePolicyDto = {
      name: formName,
      description: formDescription || undefined,
      effect: formEffect,
      resource: formResource,
      actions: formActions.split(',').map((a) => a.trim()).filter(Boolean),
      priority: parseInt(formPriority, 10) || 0,
      conditions,
    };

    try {
      if (editingId) {
        await policyApi.update(editingId, data);
      } else {
        await policyApi.create(data);
      }
      resetForm();
      await loadPolicies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (policyId: string) => {
    if (!confirm('Delete this policy?')) return;
    try {
      await policyApi.delete(policyId);
      await loadPolicies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggle = async (policy: Policy) => {
    try {
      await policyApi.update(policy.id, { enabled: !policy.enabled });
      await loadPolicies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await policyApi.evaluate({
        resource: evalResource,
        action: evalAction,
      });
      setEvalResult(result);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px',
    border: '1.5px solid #d1d5db', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', color: '#111827', background: '#fff',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '0.3rem', fontWeight: 500,
    fontSize: '0.8rem', color: '#374151',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #f9fafb)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <Link href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.85rem' }}>
              ← Back to Dashboard
            </Link>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary, #111827)', margin: '0.5rem 0 0' }}>
              Policies
            </h1>
            <p style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
              Fine-grained authorization rules for resources and actions
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowEval(!showEval)}
              style={{
                padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #d1d5db',
                background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
              }}
            >
              Test Policy
            </button>
            <button
              onClick={() => { resetForm(); setShowCreate(true); }}
              disabled={!canCreate}
              title={!canCreate ? 'You do not have permission to create policies' : ''}
              style={{
                padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none',
                background: canCreate ? '#4f46e5' : '#6b7280',
                color: '#fff', fontSize: '0.875rem', fontWeight: 600,
                cursor: canCreate ? 'pointer' : 'not-allowed',
                opacity: canCreate ? 1 : 0.5,
              }}
            >
              + Create Policy
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '10px', color: '#991b1b', fontSize: '0.9rem', marginBottom: '1rem',
          }}>
            {error}
            <button onClick={() => setError('')} style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 600 }}>×</button>
          </div>
        )}

        {/* Test Evaluation Panel */}
        {showEval && (
          <div style={{
            background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb',
            padding: '1.5rem', marginBottom: '1.5rem',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Test Policy Evaluation</h3>
            <form onSubmit={handleEvaluate} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={labelStyle}>Resource</label>
                <input value={evalResource} onChange={(e) => setEvalResource(e.target.value)} placeholder="api:orders:123" required style={inputStyle} />
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={labelStyle}>Action</label>
                <input value={evalAction} onChange={(e) => setEvalAction(e.target.value)} placeholder="read" required style={inputStyle} />
              </div>
              <button type="submit" style={{
                padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none',
                background: '#4f46e5', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              }}>
                Evaluate
              </button>
            </form>
            {evalResult && (
              <div style={{
                marginTop: '1rem', padding: '1rem', borderRadius: '8px',
                background: evalResult.decision === 'ALLOW' ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${evalResult.decision === 'ALLOW' ? '#a7f3d0' : '#fecaca'}`,
              }}>
                <div style={{ fontWeight: 600, color: evalResult.decision === 'ALLOW' ? '#065f46' : '#991b1b' }}>
                  {evalResult.decision}: {evalResult.reason}
                </div>
                {evalResult.matchedPolicy && (
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Matched: {evalResult.matchedPolicy.name} (priority {evalResult.matchedPolicy.priority})
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Form */}
        {showCreate && (
          <div style={{
            background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb',
            padding: '1.5rem', marginBottom: '1.5rem',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
              {editingId ? 'Edit Policy' : 'Create Policy'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="Allow API read access" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Effect *</label>
                  <select value={formEffect} onChange={(e) => setFormEffect(e.target.value as any)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="ALLOW">ALLOW</option>
                    <option value="DENY">DENY</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Resource Pattern *</label>
                  <input value={formResource} onChange={(e) => setFormResource(e.target.value)} required placeholder="api:orders:*" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Actions (comma-separated) *</label>
                  <input value={formActions} onChange={(e) => setFormActions(e.target.value)} required placeholder="read, write, delete" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <input type="number" value={formPriority} onChange={(e) => setFormPriority(e.target.value)} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Optional description" style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Conditions (JSON)</label>
                  <textarea
                    value={formConditions}
                    onChange={(e) => setFormConditions(e.target.value)}
                    placeholder='{"ipRange": "10.0.0.0/8", "timeWindow": "09:00-17:00"}'
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="submit" style={{
                  padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none',
                  background: '#4f46e5', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  {editingId ? 'Update Policy' : 'Create Policy'}
                </button>
                <button type="button" onClick={resetForm} style={{
                  padding: '0.6rem 1.5rem', borderRadius: '8px', border: '1px solid #d1d5db',
                  background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Policies List */}
        <div style={{
          background: 'var(--bg-card, #fff)', borderRadius: '12px',
          border: '1px solid var(--border-color, #e5e7eb)', overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
          ) : policies.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
              <p>No policies yet. Create your first policy to control access to resources.</p>
            </div>
          ) : (
            <div>
              {policies.map((policy, i) => (
                <div
                  key={policy.id}
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: i < policies.length - 1 ? '1px solid #f3f4f6' : 'none',
                    opacity: policy.enabled ? 1 : 0.5,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>{policy.name}</span>
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                          background: effectColors[policy.effect]?.bg,
                          color: effectColors[policy.effect]?.text,
                          border: `1px solid ${effectColors[policy.effect]?.border}`,
                        }}>
                          {policy.effect}
                        </span>
                        <span style={{
                          padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 500,
                          background: '#f3f4f6', color: '#6b7280',
                        }}>
                          Priority: {policy.priority}
                        </span>
                        {!policy.enabled && (
                          <span style={{
                            padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 500,
                            background: '#f3f4f6', color: '#9ca3af',
                          }}>
                            Disabled
                          </span>
                        )}
                      </div>
                      {policy.description && (
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>{policy.description}</div>
                      )}
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                        <span><strong>Resource:</strong> <code style={{ background: '#f3f4f6', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.75rem' }}>{policy.resource}</code></span>
                        <span><strong>Actions:</strong> {policy.actions.map((a) => (
                          <code key={a} style={{ background: '#f3f4f6', padding: '0.1rem 0.3rem', borderRadius: '4px', fontSize: '0.75rem', marginLeft: '0.25rem' }}>{a}</code>
                        ))}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                      <button
                        onClick={() => handleToggle(policy)}
                        style={{
                          padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid #d1d5db',
                          background: '#fff', color: '#374151', fontSize: '0.8rem', cursor: 'pointer',
                        }}
                      >
                        {policy.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => openEdit(policy)}
                        disabled={!canUpdate}
                        title={!canUpdate ? 'You do not have permission to edit policies' : ''}
                        style={{
                          padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid #d1d5db',
                          background: canUpdate ? '#fff' : '#f3f4f6',
                          color: canUpdate ? '#374151' : '#9ca3af',
                          fontSize: '0.8rem',
                          cursor: canUpdate ? 'pointer' : 'not-allowed',
                          opacity: canUpdate ? 1 : 0.5,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(policy.id)}
                        disabled={!canDelete}
                        title={!canDelete ? 'You do not have permission to delete policies' : ''}
                        style={{
                          padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid #fecaca',
                          background: canDelete ? '#fff' : '#f3f4f6',
                          color: canDelete ? '#991b1b' : '#9ca3af',
                          fontSize: '0.8rem',
                          cursor: canDelete ? 'pointer' : 'not-allowed',
                          opacity: canDelete ? 1 : 0.5,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
