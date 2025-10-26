"use client"

import * as React from "react"
import { NavMain } from "@/app/workspace/components/nav-main"
import { NavUser } from "@/app/workspace/components/nav-user"
import { TeamSwitcher } from "@/app/workspace/components/team-switcher"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

//import { getNavDataSync } from "@/lib/menu"
import { useWorkspace } from "@/lib/WorkspaceContext"
import { useUserMenu } from "@/lib/UserMenuContext"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    userRole?: string[]; // 保持向后兼容，但现在可选
}

function SidebarSkeleton() {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <Skeleton className="h-8 w-8 rounded-md" />
            </SidebarHeader>
            <SidebarContent>
                <div className="space-y-2 p-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                    ))}
                </div>
            </SidebarContent>
            <SidebarFooter>
                <Skeleton className="h-8 w-8 rounded-md" />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

export function AppSidebar({ userRole, ...props}: AppSidebarProps) {
    const { user } = useWorkspace();
    const { navData, isLoading, error, userRoles, primaryRole } = useUserMenu();

    if (isLoading || !navData) {
       
        return <SidebarSkeleton />;
    }

    if (error) {
        console.warn('菜单加载错误:', error);
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={navData.teams} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navData.navMain} />
                {/* <NavProjects projects={navData.projects} />  */}
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}       


