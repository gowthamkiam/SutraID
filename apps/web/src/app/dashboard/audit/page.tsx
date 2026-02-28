'use client';

import { useEffect, useState, use } from 'react';
import { auditApi, AuditLogEntry } from '@/lib/api';

const resultColors: Record<string, { bg: string; text: string }> = {
  SUCCESS: { bg: '#ecfdf5', text: '#065f46' },
  FAILURE: { bg: '#fef2f2', text: '#991b1b' },
  DENIED: { bg: '#fff7ed', text: '#9a3412' },
};

const actionIcons: Record<string, string> = {
  'user.login': '🔑',
  'user.logout': '🚪',
  'user.register': '👤',
  'user.password_reset': '🔄',
  'user.password_reset_requested': '📧',
  'user.password_changed': '🔒',
  'token.issued': '🎫',
  'policy.evaluated': '📋',
  'sso.login': '🔐',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [page, actionFilter, resultFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditApi.getLogs({
        action: actionFilter || undefined,
        result: resultFilter || undefined,
        page,
        limit: 25,
      });
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await auditApi.getStats(30);
      setStats(data);
    } catch {
      // Stats are optional, don't block the page
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #f9fafb)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <a href={`/dashboard`} style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.85rem' }}>
              ← Back to Dashboard
            </a>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary, #111827)', margin: '0.5rem 0 0' }}>
              Audit Logs
            </h1>
            <p style={{ color: 'var(--text-secondary, #6b7280)', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
              Track all authentication and authorization events
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              background: 'var(--bg-card, #fff)', borderRadius: '12px', padding: '1.25rem',
              border: '1px solid var(--border-color, #e5e7eb)',
            }}>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Total Events (30d)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginTop: '0.25rem' }}>{stats.totalEvents.toLocaleString()}</div>
            </div>
            {stats.byResult?.map((r: any) => (
              <div key={r.result} style={{
                background: 'var(--bg-card, #fff)', borderRadius: '12px', padding: '1.25rem',
                border: '1px solid var(--border-color, #e5e7eb)',
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>{r.result}</div>
                <div style={{
                  fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem',
                  color: resultColors[r.result]?.text || '#111827',
                }}>{r.count.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{
          display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap',
        }}>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db',
              fontSize: '0.875rem', color: '#374151', background: '#fff', cursor: 'pointer',
            }}
          >
            <option value="">All Actions</option>
            <option value="user.login">Login</option>
            <option value="user.logout">Logout</option>
            <option value="user.register">Register</option>
            <option value="user.password_reset">Password Reset</option>
            <option value="user.password_changed">Password Changed</option>
            <option value="policy.evaluated">Policy Evaluated</option>
            <option value="sso.login">SSO Login</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => { setResultFilter(e.target.value); setPage(1); }}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db',
              fontSize: '0.875rem', color: '#374151', background: '#fff', cursor: 'pointer',
            }}
          >
            <option value="">All Results</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
            <option value="DENIED">Denied</option>
          </select>

          <div style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '0.85rem', alignSelf: 'center' }}>
            {total} total events
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '10px', color: '#991b1b', fontSize: '0.9rem', marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}

        {/* Logs Table */}
        <div style={{
          background: 'var(--bg-card, #fff)', borderRadius: '12px',
          border: '1px solid var(--border-color, #e5e7eb)', overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📜</div>
              No audit logs found
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Event</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Resource</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Result</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Details</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{actionIcons[log.action] || '📌'}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#6b7280' }}>
                      {log.resource || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                        background: resultColors[log.result]?.bg || '#f3f4f6',
                        color: resultColors[log.result]?.text || '#374151',
                      }}>
                        {log.result}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280', maxWidth: '200px' }}>
                      {log.metadata && typeof log.metadata === 'object' ? (
                        <span title={JSON.stringify(log.metadata, null, 2)}>
                          {(log.metadata as any).email || (log.metadata as any).method || (log.metadata as any).reason || '—'}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
              padding: '1rem', borderTop: '1px solid #e5e7eb',
            }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                style={{
                  padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #d1d5db',
                  background: page <= 1 ? '#f3f4f6' : '#fff', cursor: page <= 1 ? 'default' : 'pointer',
                  color: page <= 1 ? '#9ca3af' : '#374151', fontSize: '0.85rem',
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #d1d5db',
                  background: page >= totalPages ? '#f3f4f6' : '#fff', cursor: page >= totalPages ? 'default' : 'pointer',
                  color: page >= totalPages ? '#9ca3af' : '#374151', fontSize: '0.85rem',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
