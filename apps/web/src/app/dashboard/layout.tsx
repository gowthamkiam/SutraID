'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import { AuthProvider } from '@/components/providers/AuthProvider';

type ColorMode = 'light' | 'dark' | 'auto';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [colorMode, setColorMode] = useState<ColorMode>('dark');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const router = useRouter();

    // Load saved color mode
    useEffect(() => {
        const saved = localStorage.getItem('colorMode') as ColorMode | null;
        if (saved) {
            setColorMode(saved);
            document.documentElement.setAttribute('data-theme', saved === 'auto' ?
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : saved);
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    const handleColorModeChange = (mode: ColorMode) => {
        setColorMode(mode);
        localStorage.setItem('colorMode', mode);

        let resolvedMode = mode;
        if (mode === 'auto') {
            resolvedMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', resolvedMode);
    };

    useEffect(() => {
        const checkAuth = async () => {
            const accessToken = localStorage.getItem('accessToken');
            const storedUser = localStorage.getItem('user');

            if (!accessToken || !storedUser) {
                router.push('/login');
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
                const response = await fetch(`${apiUrl}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Token expired');
                }

                const data = await response.json();
                setUser(data.user);
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
                await fetch(`${apiUrl}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--bg-primary)',
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid var(--accent-light)',
                    borderTop: '3px solid var(--accent-primary)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <style dangerouslySetInnerHTML={{
                    __html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
            </div>
        );
    }

    if (!user) return null;

    return (
        <AuthProvider>
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={setSidebarCollapsed}
                    user={user}
                    onLogout={handleLogout}
                />

                <div style={{
                    flex: 1,
                    marginLeft: sidebarCollapsed ? '80px' : '280px',
                    transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <DashboardNavbar
                        colorMode={colorMode}
                        onColorModeChange={handleColorModeChange}
                        user={user}
                    />

                    <main style={{ flex: 1, padding: '2rem' }}>
                        {children}
                    </main>
                </div>
            </div>
        </AuthProvider>
    );
}
