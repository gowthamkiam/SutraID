'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ssoApi, SsoProvider, OrgRole } from '@/lib/api';
import { useOrg } from '@/components/providers/OrgContextProvider';
import { hasPermission } from '@/lib/permissions';
import {
  ShieldCheck,
  Globe,
  Settings,
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  Trash2,
  Play,
  AlertCircle,
  ArrowRight,
  Shield,
  Zap,
  CheckCircle2,
  X,
  ExternalLink,
  Lock
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

interface ProviderTemplate {
  type: string;
  name: string;
  description: string;
  icon: any;
  protocol: 'SAML2' | 'OIDC';
  color: string;
}

const providerTemplates: ProviderTemplate[] = [
  {
    type: 'OKTA',
    name: 'Okta',
    description: 'Enterprise identity management and SSO platform',
    icon: Shield,
    protocol: 'SAML2',
    color: '#007dc1',
  },
  {
    type: 'AZURE_AD',
    name: 'Microsoft Entra ID',
    description: 'Active Directory and cloud identity service',
    icon: Globe,
    protocol: 'OIDC',
    color: '#0078d4',
  },
  {
    type: 'GOOGLE_WORKSPACE',
    name: 'Google Workspace',
    description: 'Unified login for Google Apps and Workspace',
    icon: Settings,
    protocol: 'SAML2',
    color: '#ea4335',
  },
  {
    type: 'GENERIC_SAML',
    name: 'Generic SAML 2.0',
    description: 'Connect any SAML 2.0 compliant IdP',
    icon: Lock,
    protocol: 'SAML2',
    color: '#6366f1',
  },
  {
    type: 'GENERIC_OIDC',
    name: 'Generic OIDC',
    description: 'Connect any OIDC compliant provider',
    icon: Zap,
    protocol: 'OIDC',
    color: '#8b5cf6',
  },
];


export default function SsoProvidersPage() {
  const { orgRole } = useOrg();
  const canCreate = hasPermission(orgRole as OrgRole, 'sso:create');
  const canUpdate = hasPermission(orgRole as OrgRole, 'sso:update');
  const canDelete = hasPermission(orgRole as OrgRole, 'sso:delete');

  const [providers, setProviders] = useState<SsoProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const params = useParams();
  const orgId = params.orgId as string;
  const router = useRouter();

  useEffect(() => {
    if (orgId) loadProviders();
  }, [orgId]);

  const loadProviders = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const data = await ssoApi.listProviders(orgId);
      setProviders(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load SSO providers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (providerId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    if (!orgId) return;
    try {
      setDeleting(providerId);
      await ssoApi.deleteProvider(orgId, providerId);
      await loadProviders();
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (provider: SsoProvider) => {
    if (!orgId) return;
    try {
      await ssoApi.updateProvider(orgId, provider.id, { enabled: !provider.enabled });
      await loadProviders();
    } catch (err: any) {
      alert('Failed to toggle: ' + err.message);
    }
  };

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProviderIcon = (type: string, protocol: string) => {
    const template = providerTemplates.find(t => t.type === type);
    const Icon = template?.icon || (protocol === 'SAML2' ? ShieldCheck : Zap);
    const color = template?.color || '#6366f1';
    return { Icon, color };
  };

  if (loading && providers.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--accent-light)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', margin: '0 0 8px', letterSpacing: '-0.025em' }}>
            SSO Connections
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Manage identity provider integrations for your enterprise.
          </p>
        </div>
        <button
          onClick={() => setShowTemplates(true)}
          disabled={!canCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: canCreate ? 'var(--btn-primary-bg)' : 'var(--btn-disabled-bg, #6b7280)',
            color: canCreate ? '#fff' : 'var(--btn-disabled-text, #9ca3af)',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: canCreate ? 'pointer' : 'not-allowed',
            boxShadow: canCreate ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none',
            transition: 'transform 0.2s',
            opacity: canCreate ? 1 : 0.5,
          }}
          onMouseEnter={e => canCreate && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => canCreate && (e.currentTarget.style.transform = 'translateY(0)')}
          title={!canCreate ? 'You do not have permission to create SSO connections' : ''}
        >
          <Plus size={18} />
          Add Connection
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search connections..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-badge)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '6px',
              background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <LayoutGrid size={16} />
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '6px',
              background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent',
              color: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: '600',
              boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <List size={16} />
            List
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredProviders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--bg-badge)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--text-tertiary)' }}>
            <ShieldCheck size={40} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 8px' }}>No connections yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem' }}>
            {searchQuery ? 'No providers match your search.' : 'Integrate with enterprise identity providers to enable SSO for your users.'}
          </p>
          <button
            onClick={() => setShowTemplates(true)}
            disabled={!canCreate}
            style={{
              background: canCreate ? 'var(--bg-badge)' : 'var(--btn-disabled-bg, #6b7280)',
              border: '1px solid var(--border-color)',
              color: canCreate ? 'var(--text-primary)' : 'var(--btn-disabled-text, #9ca3af)',
              padding: '10px 24px',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: canCreate ? 'pointer' : 'not-allowed',
              opacity: canCreate ? 1 : 0.5,
            }}
            title={!canCreate ? 'You do not have permission to create SSO connections' : ''}
          >
            Get Started
          </button>
        </div>
      ) : (
        <div style={viewMode === 'grid' ? {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.5rem',
        } : { display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredProviders.map(provider => {
            const { Icon, color } = getProviderIcon(provider.type, provider.protocol);

            if (viewMode === 'grid') {
              return (
                <div key={provider.id} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  position: 'relative',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `${color}15`,
                      color: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon size={24} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: provider.enabled ? '#10b98115' : 'var(--bg-badge)',
                        color: provider.enabled ? '#10b981' : 'var(--text-secondary)',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      }}>
                        {provider.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {provider.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', background: 'var(--bg-badge)', padding: '2px 6px', borderRadius: '4px' }}>{provider.protocol}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', background: 'var(--bg-badge)', padding: '2px 6px', borderRadius: '4px' }}>{provider.type.replace(/_/g, ' ')}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '1.5rem' }}>
                    <button
                      onClick={() => router.push(`/dashboard/${orgId}/sso/providers/${provider.id}/edit`)}
                      disabled={!canUpdate}
                      style={{
                        padding: '8px',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: canUpdate ? 'var(--text-primary)' : 'var(--btn-disabled-text, #9ca3af)',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: canUpdate ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        opacity: canUpdate ? 1 : 0.5,
                      }}
                      onMouseEnter={e => canUpdate && (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => canUpdate && (e.currentTarget.style.background = 'transparent')}
                      title={!canUpdate ? 'You do not have permission to configure SSO connections' : ''}
                    >
                      <Settings size={14} />
                      Config
                    </button>
                    <button
                      onClick={() => handleToggle(provider)}
                      disabled={!canUpdate}
                      style={{
                        padding: '8px',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: canUpdate ? (provider.enabled ? '#ef4444' : '#10b981') : 'var(--btn-disabled-text, #9ca3af)',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: canUpdate ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        opacity: canUpdate ? 1 : 0.5,
                      }}
                      onMouseEnter={e => canUpdate && (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => canUpdate && (e.currentTarget.style.background = 'transparent')}
                      title={!canUpdate ? 'You do not have permission to configure SSO connections' : ''}
                    >
                      {provider.enabled ? <X size={14} /> : <CheckCircle2 size={14} />}
                      {provider.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id, provider.name)}
                      disabled={!canDelete}
                      style={{
                        gridColumn: 'span 2',
                        padding: '8px',
                        background: 'transparent',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        color: canDelete ? 'var(--text-tertiary)' : 'var(--btn-disabled-text, #9ca3af)',
                        fontSize: '0.85rem',
                        cursor: canDelete ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '4px',
                        opacity: canDelete ? 1 : 0.5,
                      }}
                      onMouseEnter={e => {
                        if (canDelete) {
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (canDelete) {
                          e.currentTarget.style.color = 'var(--text-tertiary)';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                      title={!canDelete ? 'You do not have permission to delete SSO connections' : ''}
                    >
                      <Trash2 size={14} />
                      Delete Connection
                    </button>
                  </div>
                </div>
              );
            } else {
              // List View Item
              return (
                <div key={provider.id} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: `${color}15`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={20} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 2px' }}>{provider.name}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{provider.protocol}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>•</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{provider.type.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      background: provider.enabled ? '#10b98115' : 'var(--bg-badge)',
                      color: provider.enabled ? '#10b981' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                    }}>
                      {provider.enabled ? 'Active' : 'Inactive'}
                    </span>

                    <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

                    <button
                      onClick={() => router.push(`/dashboard/${orgId}/sso/providers/${provider.id}/edit`)}
                      disabled={!canUpdate}
                      style={{ background: 'transparent', border: 'none', color: canUpdate ? 'var(--text-secondary)' : 'var(--btn-disabled-text, #9ca3af)', cursor: canUpdate ? 'pointer' : 'not-allowed', padding: '4px', opacity: canUpdate ? 1 : 0.5 }}
                      title={canUpdate ? 'Configure' : 'You do not have permission to configure SSO connections'}
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id, provider.name)}
                      disabled={!canDelete}
                      style={{ background: 'transparent', border: 'none', color: canDelete ? 'var(--text-tertiary)' : 'var(--btn-disabled-text, #9ca3af)', cursor: canDelete ? 'pointer' : 'not-allowed', padding: '4px', opacity: canDelete ? 1 : 0.5 }}
                      title={canDelete ? 'Delete' : 'You do not have permission to delete SSO connections'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            width: '100%',
            maxWidth: '800px',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
          }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-badge)' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0 }}>Add New SSO Connection</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Select a template to get started with pre-configured settings.</p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {providerTemplates.map(template => {
                  const Icon = template.icon;
                  return (
                    <div
                      key={template.type}
                      onClick={() => router.push(`/dashboard/${orgId}/sso/providers/new?template=${template.type}`)}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = template.color;
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = `0 8px 24px ${template.color}15`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: `${template.color}15`,
                        color: template.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                      }}>
                        <Icon size={28} />
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 6px' }}>{template.name}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>{template.description}</p>

                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '700', color: template.color }}>
                        Select <ArrowRight size={14} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-badge)', display: 'flex', justifyContent: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Don&apos;t see your provider? Use <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Generic SAML</span> or <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Generic OIDC</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
