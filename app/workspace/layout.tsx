import { AppSidebar } from "@/app/workspace/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";

import { redirect } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { WorkspaceProvider } from "@/lib/WorkspaceContext";
import { logger } from "@/lib/logger";
import { TokenPayload } from "../models";
import { DynamicBreadcrumb } from "./components/DynamicBreadcrumb";
import { fetchRemoteData, getToken } from "@/lib/api-utils";

export const dynamic = 'force-dynamic';

export async function getWorkspaceData() {
    try {
      
        const token = await getToken();
        const decoded = jwtDecode<TokenPayload>(token);
        const username = decoded.username;

        const [userResponse, orgResponse] = await Promise.all([
            fetchRemoteData({endpoint: `/users/${username}`}),
            fetchRemoteData({endpoint: `/users/${username}/tenants`}),
        ]);

        if (!userResponse.success) {
            logger.error(`Failed to fetch user data: ${userResponse.status} - ${userResponse.error}`);
            redirect('/login');
        }

        if (!orgResponse.success) {
            logger.error(`Failed to fetch organization data: ${orgResponse.status} - ${orgResponse.error}`);
            redirect('/login');
        }

        const [userData, orgData] = await Promise.all([
            userResponse.data,
            orgResponse.data
        ]);
        
        return { 
            user: userData.data, 
            organization: orgData.data, 
            roles: decoded.roles 
        };
    } catch (error) {
        logger.error('Error in getWorkspaceData:', error);
        if (error instanceof Error) {
            logger.error(`Error details: ${error.message}`);
            logger.error(`Stack trace: ${error.stack}`);
        }
        redirect('/login');
    }
}

export default async function Page({ children }: { children: React.ReactNode }) {
    const { user, organization, roles } = await getWorkspaceData();
    
    return (
        <WorkspaceProvider initialData={{ organization: organization, user: user }}>
            <SidebarProvider>
                <AppSidebar userRole={roles} />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <DynamicBreadcrumb />
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </WorkspaceProvider>
    )
}

