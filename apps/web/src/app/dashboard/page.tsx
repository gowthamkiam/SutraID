'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRoot() {
    const router = useRouter();

    useEffect(() => {
        const checkAuthAndRedirect = () => {
            const accessToken = localStorage.getItem('accessToken');
            const userStr = localStorage.getItem('user');

            if (!accessToken || !userStr) {
                router.push('/login');
                return;
            }

            try {
                const user = JSON.parse(userStr);
                const orgId = user.organizationId || localStorage.getItem('currentOrgId');

                if (orgId) {
                    router.push(`/dashboard/${orgId}`);
                } else {
                    // Fallback if no org found - auth layout will handle fetching orgs
                    // but we need a page to land on.
                    router.push('/dashboard/select-org');
                }
            } catch (e) {
                router.push('/login');
            }
        };

        checkAuthAndRedirect();
    }, [router]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--bg-primary)',
        }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
}
