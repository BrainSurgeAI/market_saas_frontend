"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"

import { User } from "@/app/models"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ChangePasswordDialog } from "./change-password-dialog"

export function NavUser({ user }: { user: User }) {

  const { isMobile } = useSidebar();
  const [notificationCount, setNotificationCount] = useState(0);
  const router = useRouter();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Get notification count
  const getNotificationCount = async () => {
    const res = await fetch(`/api/users/${user.username}/notifications`);
    if (!res.ok) {
      console.error("Failed to fetch notification count");
      return 0;
    }

    const data = await res.json();
    return data.length;
  }

  useEffect(() => {
    getNotificationCount().then(setNotificationCount);
  }, [user.username]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('登出失败');
      }

      toast({
        variant: "success",
        title: "登出成功",
        description: "正在跳转到登录页面...",
      });

      router.push('/login');
      router.refresh();

    } catch (error) {
      toast({
        title: "登出失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 bg-black">
                  {/* <AvatarImage src={user.avatar} alt={user.username} /> */}
                  <AvatarFallback className="rounded-lg text-sm"> {user.name?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="rounded-lg"> {user.name?.[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Sparkles />
                  Upgrade to Pro
                </DropdownMenuItem>
              </DropdownMenuGroup> */}
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  修改密码
                </DropdownMenuItem>
                {/* <DropdownMenuItem>
                  <CreditCard />
                  Billing
                </DropdownMenuItem> */}
                <DropdownMenuItem>
                  <div className="flex items-center">
                    <Bell className="mr-2 h-4 w-4" />
                    <span className="pr-2">消息</span>
                    <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {notificationCount}
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                退出
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <ChangePasswordDialog 
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        username={user.username}
      />
    </>
  )
}
