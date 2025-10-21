'use client';

import { createContext, ReactNode, useContext } from 'react';
import { Organization, User } from '@/app/models';

interface WorkspaceContextType {
    organization: Organization;
    user: User;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return context;
}

export function WorkspaceProvider({
    children,
    initialData
}: {
    children: ReactNode;
    initialData: WorkspaceContextType;
}) {
    return (
        <WorkspaceContext.Provider value={initialData}>
            {children}
        </WorkspaceContext.Provider>
    );
}

