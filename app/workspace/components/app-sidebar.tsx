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

import { getNavData } from "@/lib/menu"
import { useWorkspace } from "@/lib/WorkspaceContext"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    userRole: string[];
}

export function AppSidebar({userRole, ...props }: AppSidebarProps) {
    
    const {user, organization} = useWorkspace();
    const roles = Array.isArray(userRole) ? userRole : [userRole];
    const data = getNavData(organization, roles);
   
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={data.teams} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                {/* <NavProjects projects={data.projects} />  */}
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}       


