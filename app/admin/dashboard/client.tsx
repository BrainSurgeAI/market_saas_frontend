'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { TokenPayload } from "@/app/models";
import { UsersRound, ShieldCheck, Cog, FileText, UserCog } from "lucide-react";

interface AdminDashboardClientProps {
  token: string;
}

export default function AdminDashboardClient({ token }: AdminDashboardClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      toast({
        variant: 'destructive',
        title: '未授权访问',
        description: '请先登录',
      });
      router.push('/admin/login');
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      
      if (!decoded.is_super_admin) {
        toast({
          variant: 'destructive',
          title: '权限不足',
          description: '只有超级管理员才能访问此页面',
        });
        router.push('/login');
        return;
      }
      
      setIsSuperAdmin(decoded.is_super_admin);
      setUsername(decoded.username);
      setIsLoading(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '令牌无效',
        description: '请重新登录',
      });
      router.push('/admin/login');
    }
  }, [router, toast, token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">加载中...</h1>
          <p className="text-muted-foreground">请稍候，正在加载管理面板</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">系统管理</h1>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">欢迎回来，</span>
          <span className="font-medium">{username}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/admin/roles')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl font-bold">角色管理</CardTitle>
            <UserCog className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm mt-2">
              创建和管理系统角色，分配权限和功能访问权限。
            </CardDescription>
            <Button variant="default" className="mt-4 w-full" onClick={(e) => {
              e.stopPropagation();
              router.push('/admin/roles');
            }}>
              管理角色
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/admin/permissions')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl font-bold">权限配置</CardTitle>
            <ShieldCheck className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm mt-2">
              配置系统权限，定义资源访问控制和功能操作权限。
            </CardDescription>
            <Button variant="default" className="mt-4 w-full" onClick={(e) => {
              e.stopPropagation();
              router.push('/admin/permissions');
            }}>
              配置权限
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/admin/users')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl font-bold">用户管理</CardTitle>
            <UsersRound className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm mt-2">
              管理系统用户，分配角色和权限，控制用户访问级别。
            </CardDescription>
            <Button variant="default" className="mt-4 w-full" onClick={(e) => {
              e.stopPropagation();
              router.push('/admin/users');
            }}>
              管理用户
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/admin/settings')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl font-bold">系统设置</CardTitle>
            <Cog className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm mt-2">
              配置系统全局设置，包括安全策略、登录设置和系统参数。
            </CardDescription>
            <Button variant="default" className="mt-4 w-full" onClick={(e) => {
              e.stopPropagation();
              router.push('/admin/settings');
            }}>
              修改设置
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/admin/logs')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl font-bold">日志审计</CardTitle>
            <FileText className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm mt-2">
              查看系统操作日志，追踪用户行为和系统变更记录。
            </CardDescription>
            <Button variant="default" className="mt-4 w-full" onClick={(e) => {
              e.stopPropagation();
              router.push('/admin/logs');
            }}>
              查看日志
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 