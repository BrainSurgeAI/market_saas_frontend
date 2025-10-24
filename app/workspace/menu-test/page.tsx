'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getUserMenuConfig, getUserRoles } from '@/lib/menu';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { RefreshCw, Settings, User, Menu, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MenuTestPage() {
    const { user, organization } = useWorkspace();
    const { toast } = useToast();
    const [userMenuConfig, setUserMenuConfig] = useState<any>(null);
    const [availableRoles, setAvailableRoles] = useState<any[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadAvailableRoles();
        loadUserMenuConfig();
    }, []);

    const loadAvailableRoles = async () => {
        try {
            const roles = await getUserRoles();
            setAvailableRoles(roles);
        } catch (error) {
            console.error('加载角色列表失败:', error);
        }
    };

    const loadUserMenuConfig = async () => {
        setIsLoading(true);
        try {
            const config = await getUserMenuConfig();
            setUserMenuConfig(config);
            if (config) {
                setSelectedRoles(config.userRoles);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "加载失败",
                description: "无法加载菜单配置"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = (roleValue: string) => {
        // 这里可以发送请求到后端更新用户角色
        // 暂时只是模拟
        setSelectedRoles([roleValue]);
        toast({
            title: "角色已更新",
            description: `用户角色已更新为: ${roleValue}`
        });

        // 重新加载菜单配置
        setTimeout(loadUserMenuConfig, 500);
    };

    const simulateUserRoleChange = async (role: string) => {
        // 模拟设置用户角色
        try {
            const response = await fetch('/api/user/menu', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-roles': encodeURIComponent(JSON.stringify([role])),
                },
                cache: 'no-store'
            });

            if (response.ok) {
                const result = await response.json();
                setUserMenuConfig(result.data);
                setSelectedRoles(result.data.userRoles);
                toast({
                    title: "角色切换成功",
                    description: `当前角色: ${result.data.primaryRole}`
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "角色切换失败",
                description: "无法切换到指定角色"
            });
        }
    };

    if (!user || !organization) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">用户信息加载中...</h1>
                    <p className="text-muted-foreground">请确保用户已登录</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">菜单测试</h1>
                    <p className="text-muted-foreground mt-1">
                        查看和测试当前用户的菜单配置
                    </p>
                </div>
                <Button onClick={loadUserMenuConfig} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    刷新菜单
                </Button>
            </div>

            {/* 用户信息 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        用户信息
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">用户名</p>
                            <p className="font-medium">{user.name || '未知用户'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">组织</p>
                            <p className="font-medium">{organization.name || '未知组织'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">当前角色</p>
                            <div className="flex gap-1 flex-wrap mt-1">
                                {selectedRoles.map((role, index) => (
                                    <Badge key={index} variant="secondary">
                                        {role}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">组织代码</p>
                            <p className="font-medium">{organization.nameHash || '无'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 角色模拟 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        角色模拟
                    </CardTitle>
                    <CardDescription>
                        模拟不同角色查看对应的菜单配置（仅用于测试）
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {['super_admin', 'market_admin', 'pricer', 'auditor', 'guest'].map((role) => (
                            <Button
                                key={role}
                                variant={selectedRoles.includes(role) ? "default" : "outline"}
                                size="sm"
                                onClick={() => simulateUserRoleChange(role)}
                            >
                                {role === 'super_admin' && '超级管理员'}
                                {role === 'market_admin' && '市场管理员'}
                                {role === 'pricer' && '报价员'}
                                {role === 'auditor' && '审计员'}
                                {role === 'guest' && '访客'}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 菜单配置展示 */}
            {userMenuConfig && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Menu className="h-5 w-5" />
                            菜单配置
                        </CardTitle>
                        <CardDescription>
                            主角色: <Badge variant="outline">{userMenuConfig.primaryRole}</Badge>
                            菜单项数: <Badge variant="outline">{userMenuConfig.menuConfig.navMain.length}</Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {userMenuConfig.menuConfig.navMain.map((menuItem: any, index: number) => (
                            <div key={index} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-gray-100 rounded">
                                            <div className="w-4 h-4 bg-gray-300 rounded"></div>
                                        </div>
                                        <h3 className="font-semibold">{menuItem.title}</h3>
                                        {menuItem.isActive && (
                                            <Badge variant="default" className="text-xs">激活</Badge>
                                        )}
                                    </div>
                                    {menuItem.url && (
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                            {menuItem.url}
                                        </code>
                                    )}
                                </div>

                                {menuItem.items && menuItem.items.length > 0 && (
                                    <div className="ml-6 space-y-1">
                                        {menuItem.items.map((subItem: any, subIndex: number) => (
                                            <div key={subIndex} className="flex items-center justify-between py-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                    <span className="text-sm">{subItem.title}</span>
                                                </div>
                                                {subItem.url && (
                                                    <code className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-600">
                                                        {subItem.url}
                                                    </code>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* 开发说明 */}
            <Card>
                <CardHeader>
                    <CardTitle>开发说明</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-medium mb-2">当前实现状态</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>✅ 前端菜单加载逻辑已更新</li>
                            <li>✅ 用户专用API端点已创建（使用模拟数据）</li>
                            <li>✅ 角色切换测试功能可用</li>
                            <li>⏳ 后端API待开发</li>
                        </ul>
                    </div>

                    <Separator />

                    <div>
                        <h4 className="font-medium mb-2">后端开发指南</h4>
                        <div className="space-y-2 text-sm">
                            <p><strong>API端点:</strong> <code>GET /api/user/menu</code></p>
                            <p><strong>请求头:</strong> <code>Authorization: Bearer {`{token}`}</code></p>
                            <p><strong>响应格式:</strong></p>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`{
  "code": 200,
  "message": "获取用户菜单配置成功",
  "data": {
    "userRoles": ["super_admin", "market_admin"],
    "primaryRole": "super_admin",
    "menuConfig": {
      "teams": [...],
      "navMain": [...],
      "projects": [...]
    }
  }
}`}
                            </pre>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}