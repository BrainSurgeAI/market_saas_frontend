'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { LogIn, User, Building, Settings } from 'lucide-react';

export default function LoginSimulator() {
    const { toast } = useToast();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // 模拟用户数据
    const mockUsers = [
        {
            id: 1,
            name: '超级管理员',
            email: 'admin@example.com',
            roles: ['super_admin'],
            organization: {
                id: 1,
                name: '邦来惠集团',
                nameHash: 'banglaihui'
            }
        },
        {
            id: 2,
            name: '市场管理员',
            email: 'market@example.com',
            roles: ['market_admin'],
            organization: {
                id: 2,
                name: '北京市场',
                nameHash: 'beijing-market'
            }
        },
        {
            id: 3,
            name: '报价员',
            email: 'pricer@example.com',
            roles: ['pricer'],
            organization: {
                id: 3,
                name: '上海报价中心',
                nameHash: 'shanghai-pricing'
            }
        },
        {
            id: 4,
            name: '审计员',
            email: 'auditor@example.com',
            roles: ['auditor'],
            organization: {
                id: 4,
                name: '审计部门',
                nameHash: 'audit-dept'
            }
        },
        {
            id: 5,
            name: '访客用户',
            email: 'guest@example.com',
            roles: ['guest'],
            organization: {
                id: 5,
                name: '体验组织',
                nameHash: 'demo-org'
            }
        }
    ];

    const handleLogin = (user: any) => {
        // 模拟登录过程
        try {
            // 存储用户信息到localStorage
            localStorage.setItem('current-user', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email
            }));

            // 存储组织信息
            localStorage.setItem('current-organization', JSON.stringify(user.organization));

            // 存储用户角色
            localStorage.setItem('user-roles', JSON.stringify(user.roles));

            // 模拟token
            const mockToken = `mock-${user.roles[0]}-token-${Date.now()}`;
            document.cookie = `auth-token=${mockToken}; path=/; max-age=86400`;

            setCurrentUser(user);
            setIsLoggedIn(true);

            toast({
                title: "登录成功",
                description: `欢迎，${user.name}！角色：${user.roles.join(', ')}`
            });

            // 刷新页面以触发菜单重新加载
            setTimeout(() => {
                window.location.href = '/workspace/menu-test';
            }, 1500);

        } catch (error) {
            toast({
                variant: "destructive",
                title: "登录失败",
                description: "无法保存用户信息"
            });
        }
    };

    const handleLogout = () => {
        try {
            // 清除localStorage
            localStorage.removeItem('current-user');
            localStorage.removeItem('current-organization');
            localStorage.removeItem('user-roles');

            // 清除cookie
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

            setCurrentUser(null);
            setIsLoggedIn(false);

            toast({
                title: "退出成功",
                description: "您已成功退出登录"
            });

        } catch (error) {
            toast({
                variant: "destructive",
                title: "退出失败",
                description: "无法清除用户信息"
            });
        }
    };

    const checkLoginStatus = () => {
        const user = localStorage.getItem('current-user');
        const roles = localStorage.getItem('user-roles');
        const org = localStorage.getItem('current-organization');

        if (user && roles && org) {
            try {
                setCurrentUser({
                    ...JSON.parse(user),
                    roles: JSON.parse(roles),
                    organization: JSON.parse(org)
                });
                setIsLoggedIn(true);
            } catch (error) {
                console.error('解析用户信息失败:', error);
            }
        }
    };

    useState(() => {
        checkLoginStatus();
    });

    if (isLoggedIn && currentUser) {
        return (
            <div className="container mx-auto p-6">
                <Card className="max-w-2xl mx-auto">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <User className="h-6 w-6" />
                            登录状态
                        </CardTitle>
                        <CardDescription>
                            当前登录用户信息
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-10 w-10 text-blue-600" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">{currentUser.name}</h2>
                            <p className="text-muted-foreground">{currentUser.email}</p>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">用户角色</p>
                                <div className="flex gap-1 flex-wrap">
                                    {currentUser.roles.map((role: string, index: number) => (
                                        <Badge key={index} variant="secondary">
                                            {role === 'super_admin' && '超级管理员'}
                                            {role === 'market_admin' && '市场管理员'}
                                            {role === 'pricer' && '报价员'}
                                            {role === 'auditor' && '审计员'}
                                            {role === 'guest' && '访客'}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">所属组织</p>
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    <span className="font-medium">{currentUser.organization.name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    代码: {currentUser.organization.nameHash}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex gap-2">
                            <Button
                                onClick={() => window.location.href = '/workspace/menu-test'}
                                className="flex-1"
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                测试菜单
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="flex-1"
                            >
                                <LogIn className="mr-2 h-4 w-4" />
                                退出登录
                            </Button>
                        </div>

                        <div className="text-xs text-muted-foreground text-center">
                            提示：点击"测试菜单"查看当前用户的菜单配置
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">登录模拟器</h1>
                    <p className="text-muted-foreground mt-2">
                        模拟不同用户登录，测试动态菜单配置
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mockUsers.map((user) => (
                        <Card key={user.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg">{user.name}</CardTitle>
                                <CardDescription>{user.email}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">角色</p>
                                    <div className="flex gap-1 flex-wrap">
                                        {user.roles.map((role: string, index: number) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                                {role === 'super_admin' && '超级管理员'}
                                                {role === 'market_admin' && '市场管理员'}
                                                {role === 'pricer' && '报价员'}
                                                {role === 'auditor' && '审计员'}
                                                {role === 'guest' && '访客'}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">组织</p>
                                    <div className="flex items-center gap-2">
                                        <Building className="h-4 w-4" />
                                        <span className="text-sm">{user.organization.name}</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleLogin(user)}
                                    className="w-full"
                                >
                                    <LogIn className="mr-2 h-4 w-4" />
                                    登录
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>使用说明</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <h4 className="font-medium">测试流程</h4>
                                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                    <li>选择一个用户进行登录</li>
                                    <li>登录后自动跳转到菜单测试页面</li>
                                    <li>查看该用户的菜单配置</li>
                                    <li>可以切换不同角色测试菜单变化</li>
                                </ol>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-medium">注意事项</h4>
                                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>这是模拟登录，仅用于测试</li>
                                    <li>用户信息存储在localStorage中</li>
                                    <li>退出登录会清除所有存储的信息</li>
                                    <li>菜单配置会根据用户角色动态变化</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}