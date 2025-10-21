"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Menu,
  User,
  Settings,
  Shield,
  ChevronDown,
  KeyRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ChangePasswordDialog } from "./components/ChangePasswordDialog";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  
  // 判断是否在登录页面
  const isLoginPage = pathname === '/admin/login';

  // 使用useCallback优化处理函数
  const handleClosePasswordDialog = useCallback(() => {
    setShowChangePasswordDialog(false);
    // 强制触发一次重新渲染，确保UI完全更新
    setTimeout(() => {
      document.body.style.pointerEvents = '';
    }, 100);
  }, []);

  // 监听ESC键，确保对话框关闭后UI能正常工作
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showChangePasswordDialog) {
        handleClosePasswordDialog();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [showChangePasswordDialog, handleClosePasswordDialog]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "登出成功",
          description: "您已成功退出登录",
        });
        router.push('/admin/login');
      } else {
        toast({
          variant: "destructive",
          title: "登出失败",
          description: "退出登录时出现问题",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "登出失败",
        description: "连接服务器时出现问题",
      });
    }
  };

  const navItems = [
    { name: "仪表盘", href: "/admin/dashboard", icon: Settings },
    { name: "角色管理", href: "/admin/roles", icon: User },
    { name: "权限配置", href: "/admin/permissions", icon: Shield },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* 登录页面不显示header */}
      {!isLoginPage && (
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold">管理后台</span>
            </Link>

            {/* 桌面导航 */}
            <nav className="hidden md:flex items-center space-x-4 ml-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 退出登录按钮 - 桌面版 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:flex gap-1 items-center">
                  <User className="h-4 w-4" />
                  <span>管理员</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile">个人资料</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowChangePasswordDialog(true)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>修改密码</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 移动端导航按钮 */}
            <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">打开菜单</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%] sm:w-[385px]">
                <div className="flex flex-col h-full">
                  <div className="px-2 py-6">
                    <h2 className="text-lg font-semibold mb-6">管理菜单</h2>
                    <nav className="flex flex-col gap-2">
                      {navItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center text-sm py-3 px-4 rounded-md hover:bg-gray-100"
                          onClick={() => setIsMobileNavOpen(false)}
                        >
                          <item.icon className="h-5 w-5 mr-3" />
                          {item.name}
                        </Link>
                      ))}
                      <button
                        onClick={() => {
                          setIsMobileNavOpen(false);
                          setShowChangePasswordDialog(true);
                        }}
                        className="flex items-center text-sm py-3 px-4 rounded-md hover:bg-gray-100"
                      >
                        <KeyRound className="h-5 w-5 mr-3" />
                        修改密码
                      </button>
                      <button
                        onClick={() => {
                          setIsMobileNavOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center text-sm py-3 px-4 rounded-md hover:bg-gray-100 text-red-600 mt-4"
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        退出登录
                      </button>
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
      )}

      {/* 主内容区 - 对登录页面应用不同的样式 */}
      <main className={cn(
        "flex-1",
        !isLoginPage && "py-6"
      )}>
        {children}
      </main>

      {/* 修改密码对话框 */}
      <ChangePasswordDialog
        isOpen={showChangePasswordDialog}
        onClose={handleClosePasswordDialog}
      />
    </div>
  );
} 