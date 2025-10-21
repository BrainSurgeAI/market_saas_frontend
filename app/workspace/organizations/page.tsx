"use client"

// This page is only for organization admin
// Tenant credit info is displayed when organization is authorized.

import { useState } from 'react';
import { useWorkspace } from '@/lib/WorkspaceContext';

import { CreditInfoCard } from '../components/admin/CreditCard';
import { OrganizationCard } from '../components/OrganizationCard';

export default function OrganizationPage() {
    const { organization: org } = useWorkspace();
    const [isEditMode, setIsEditMode] = useState(false);

    const renderContent = () => {
        return (
            <div>
                <OrganizationCard
                    organization={org || null}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                />
                <CreditInfoCard organizationNameHash={org?.nameHash} />
            </div>
        );
    };

    return (
        <div>
            {renderContent()}
        </div>
    );
}