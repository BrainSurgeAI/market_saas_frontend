'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Settings, Menu, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Role, RoleMenuConfig } from '@/app/types/menuTypes';
import { Skeleton } from '@/components/ui/skeleton';

export default function MenuManagementPage() {
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [menuConfigs, setMenuConfigs] = useState<RoleMenuConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRoles();
        fetchMenuConfigs();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await fetch('/api/admin/roles?activeOnly=true');
            if (response.ok) {
                const result = await response.json();
                setRoles(result.data || []);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "获取角色失败",
                description: "无法加载角色列表"
            });
        }
    };

    const fetchMenuConfigs = async () => {
        try {
            const response = await fetch('/api/admin/menu-config');
            if (response.ok) {
                const result = await response.json();
                setMenuConfigs(result.data || []);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "获取菜单配置失败",
                description: "无法加载菜单配置"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">菜单管理</h1>
                        <p className="text-muted-foreground mt-1">管理不同角色的菜单配置</p>
                    </div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <Skeleton className="h-6 w-48 mb-2" />
                                <Skeleton className="h-4 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">菜单管理</h1>
                    <p className="text-muted-foreground mt-1">管理不同角色的菜单配置</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    配置菜单
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            角色菜单配置
                        </CardTitle>
                        <CardDescription>
                            为不同角色配置专属菜单
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>角色</TableHead>
                                    <TableHead>描述</TableHead>
                                    <TableHead>菜单数量</TableHead>
                                    <TableHead>优先级</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.map((role) => {
                                    const menuConfig = menuConfigs.find(config => config.roleId === role.id);
                                    const menuCount = menuConfig?.menuItems?.length || 0;

                                    return (
                                        <TableRow key={role.id}>
                                            <TableCell className="font-medium">
                                                {role.name}
                                            </TableCell>
                                            <TableCell>
                                                {role.description || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Menu className="h-4 w-4" />
                                                    <span>{menuCount}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {role.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={role.isActive ? "default" : "secondary"}>
                                                    {role.isActive ? "激活" : "禁用"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            toast({
                                                                title: "功能开发中",
                                                                description: "菜单编辑功能即将推出"
                                                            });
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {roles.length === 0 && (
                            <div className="text-center py-8">
                                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">暂无角色</h3>
                                <p className="text-muted-foreground">
                                    请先创建角色，然后为角色配置菜单
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 使用说明 */}
                <Card>
                    <CardHeader>
                        <CardTitle>使用说明</CardTitle>
                        <CardDescription>
                            如何配置动态菜单
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <h4 className="font-medium">后端配置</h4>
                                <p className="text-sm text-muted-foreground">
                                    通过后端API配置角色和对应的菜单结构，支持动态图标映射和URL模板。
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">优先级机制</h4>
                                <p className="text-sm text-muted-foreground">
                                    用户拥有多个角色时，系统会自动选择优先级最高的角色菜单。
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">URL模板</h4>
                                <p className="text-sm text-muted-foreground">
                                    支持动态URL占位符，如:org_name、:customer_id等，会在运行时自动替换。
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">后备机制</h4>
                                <p className="text-sm text-muted-foreground">
                                    当动态菜单配置不可用时，系统会自动回退到静态菜单配置。
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}