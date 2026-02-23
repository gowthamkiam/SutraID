'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface OrgContextType {
    orgId: string | null;
    orgName: string | null;
    orgRole: string | null;
    isLoading: boolean;
    refreshOrg: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const [orgInfo, setOrgInfo] = useState<{ id: string | null; name: string | null; role: string | null }>({
        id: null,
        name: null,
        role: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    const orgIdFromUrl = params?.orgId as string | undefined;

    const fetchOrgInfo = async () => {
        setIsLoading(true);
        try {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                setIsLoading(false);
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
            const response = await fetch(`${apiUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user;

                // If we have an orgId in URL, we expect the token to have that org context.
                // Our backend now ensures this via OrgGuard.
                // We take the info from the token metadata (user object returned by /auth/me)
                setOrgInfo({
                    id: user.org_id || user.organizationId,
                    name: user.org_name || (user.organization?.name),
                    role: user.org_role || user.role,
                });
            }
        } catch (error) {
            console.error('Failed to fetch org info:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgInfo();
    }, [orgIdFromUrl]);

    return (
        <OrgContext.Provider value={{
            orgId: orgInfo.id,
            orgName: orgInfo.name,
            orgRole: orgInfo.role,
            isLoading,
            refreshOrg: fetchOrgInfo
        }}>
            {children}
        </OrgContext.Provider>
    );
}

export function useOrg() {
    const context = useContext(OrgContext);
    if (context === undefined) {
        throw new Error('useOrg must be used within an OrgProvider');
    }
    return context;
}
