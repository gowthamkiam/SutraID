'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LoginForm, { CustomLoginConfig } from '@/components/auth/LoginForm';

interface OrgPublicInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  customLoginConfig: CustomLoginConfig | null;
}

export default function OrgLoginPage() {
  const params = useParams();
  const router = useRouter();
  const orgIdentifier = params.orgIdentifier as string;

  const [org, setOrg] = useState<OrgPublicInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrg = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      try {
        const response = await fetch(`${apiUrl}/auth/org-lookup/${encodeURIComponent(orgIdentifier)}`);
        if (!response.ok) {
          router.replace('/login?error=org_not_found');
          return;
        }
        const data: OrgPublicInfo = await response.json();
        setOrg(data);
      } catch {
        router.replace('/login?error=org_not_found');
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, [orgIdentifier, router]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0a1628 0%, #0f2035 25%, #0d2847 50%, #0a2a3c 75%, #0e1f2f 100%)',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.8 }}>Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!org) return null;

  const bgColor = org.customLoginConfig?.backgroundColor
    || 'linear-gradient(160deg, #0a1628 0%, #0f2035 25%, #0d2847 50%, #0a2a3c 75%, #0e1f2f 100%)';

  const isGradient = bgColor.includes('gradient') || bgColor.includes('linear');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      padding: '2rem',
      ...(isGradient
        ? { background: bgColor }
        : { backgroundColor: bgColor }),
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        background: '#ffffff',
        padding: '3rem 2.5rem',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        maxWidth: '440px',
        width: '100%',
        position: 'relative',
        zIndex: 1,
      }}>
        <LoginForm
          organizationId={org.id}
          organizationName={org.name}
          branding={org.customLoginConfig}
        />
      </div>

      {/* Back to org finder */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center', zIndex: 1 }}>
        <a
          href="/login"
          style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textDecoration: 'none' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
        >
          Not your organization? Go back
        </a>
      </div>
    </div>
  );
}
