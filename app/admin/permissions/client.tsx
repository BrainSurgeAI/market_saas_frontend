'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Shield, Globe, Lock, Unlock, Filter, RefreshCw, Edit } from 'lucide-react';
import { Permission } from '@/app/types/permissionTypes';
import { AddPermissionDialog } from './components/AddPermissionDialog';
import { EditPermissionDialog } from './components/EditPermissionDialog';
import { Skeleton } from '@/components/ui/skeleton';

interface PermissionsClientProps {
  token: string;
}

export default function PermissionsClient({ token }: PermissionsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/permissions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'gzip',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const data = await response.json();
      if (data.code === 200) {
        setPermissions(data.data);
      } else {
        throw new Error('Failed to fetch permissions');
      }

    } catch (error) {

      toast({
        variant: 'destructive',
        title: '数据加载失败',
        description: '获取权限数据时出错',
      });

    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [router, toast, token]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch =
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.cname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (permission.pathPattern && permission.pathPattern.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (permission.httpMethod && permission.httpMethod.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSelection = !showSelectedOnly || selectedPermissions.includes(permission.id);

    return matchesSearch && matchesSelection;
  });

  const togglePermission = (id: number) => {
    setSelectedPermissions(prevSelected =>
      prevSelected.includes(id)
        ? prevSelected.filter(permId => permId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSavePermissions = () => {
    // 在实际应用中，这里应该调用API保存权限设置
    toast({
      title: '权限已保存',
      description: `已选择 ${selectedPermissions.length} 个权限`,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchPermissions();
      toast({
        title: '刷新成功',
        description: '权限列表已更新',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    setShowEditDialog(true);
  };

  const handleEditPermissionSuccess = () => {
    fetchPermissions(); // 刷新权限列表
  };

  const handleAddPermissionSuccess = () => {
    fetchPermissions(); // 刷新权限列表
  };

  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    // 使用HTTP方法作为分类，或者使用"其他"作为默认分类
    const category = permission.httpMethod || "其他";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="mb-6">
          <Skeleton className="h-10 w-full" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">权限管理</h3>
            <p className="text-muted-foreground mt-1 text-sm">管理系统权限和资源访问控制</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSavePermissions} disabled={selectedPermissions.length === 0}>
            保存权限设置 ({selectedPermissions.length})
          </Button>
          <Button variant="outline" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            添加权限
          </Button>
        </div>
      </div>

      {/* 搜索和过滤工具栏 */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="搜索权限名称、代码、路径或HTTP方法..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showSelectedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSelectedOnly(!showSelectedOnly)}
            className="whitespace-nowrap"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showSelectedOnly ? '显示全部' : '仅显示已选'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总权限数</p>
                <p className="text-2xl font-bold">{permissions.length}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已选择</p>
                <p className="text-2xl font-bold">{selectedPermissions.length}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">私有权限</p>
                <p className="text-2xl font-bold">
                  {permissions.filter(p => p.selfOnly === 1).length}
                </p>
              </div>
              <Lock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">公开权限</p>
                <p className="text-2xl font-bold">
                  {permissions.filter(p => p.selfOnly !== 1).length}
                </p>
              </div>
              <Unlock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {Object.entries(groupedPermissions).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">没有找到权限</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || showSelectedOnly
                ? '尝试调整搜索条件或过滤器'
                : '点击"添加权限"创建第一个权限'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedPermissions).map(([category, perms]) => (
          <Card key={category} className="mb-6 overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    {category.toUpperCase()} 权限
                  </CardTitle>
                  <CardDescription>
                    {perms.length} 个 {category} 方法权限
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="hidden sm:flex">
                  {perms.length} 项
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-12">
                        <span className="sr-only">选择</span>
                      </TableHead>
                      <TableHead>权限代码</TableHead>
                      <TableHead className="hidden md:table-cell">描述</TableHead>
                      <TableHead className="hidden md:table-cell">API路径</TableHead>
                      <TableHead className="hidden lg:table-cell">方法</TableHead>
                      <TableHead className="hidden lg:table-cell">访问控制</TableHead>
                      <TableHead className="w-16">
                        <span className="sr-only">操作</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perms.map((permission) => (
                      <TableRow
                        key={permission.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {permission.name}
                            </Badge>
                            {selectedPermissions.includes(permission.id) && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                            )}
                          </div>
                        </TableCell>
                      
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {permission.description || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {permission.pathPattern || '-'}
                            </code>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {permission.httpMethod ? (
                            <Badge
                              variant={
                                permission.httpMethod === 'GET' ? 'secondary' :
                                permission.httpMethod === 'POST' ? 'default' :
                                permission.httpMethod === 'PUT' ? 'outline' :
                                permission.httpMethod === 'DELETE' ? 'destructive' :
                                'secondary'
                              }
                              className="font-mono text-xs"
                            >
                              {permission.httpMethod}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {permission.selfOnly === 1 ? (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="mr-1 h-3 w-3" />
                              私有
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <Unlock className="mr-1 h-3 w-3" />
                              公开
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPermission(permission)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">编辑</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <AddPermissionDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleAddPermissionSuccess}
        token={token}
      />

      <EditPermissionDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSuccess={handleEditPermissionSuccess}
        token={token}
        permission={editingPermission}
      />
    </div>
  );
} 