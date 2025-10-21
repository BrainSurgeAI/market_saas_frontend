'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Permission, PermissionGroup } from "@/app/types/permissionTypes";
import { Role } from "@/app/types/roleTypes";
import { ArrowLeft, Save, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RolePermissionsClientProps {
  token: string;
  role: Role;
  roleId: string;
}

export default function RolePermissionsClient({
  token,
  role,
  roleId,
}: RolePermissionsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<PermissionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (!token) {
      router.push('/admin/login');
      return;
    }
    
    Promise.all([
      fetchPermissions(),
      fetchRolePermissions()
    ]).then(() => {
      setIsLoading(false);
    });
  }, [router, token, roleId]);

  useEffect(() => {
    if (permissions.length > 0 && selectedPermissions.length === 0) {
      const defaultSelected = permissions.slice(0, 5).map(p => p.id);
      setSelectedPermissions(defaultSelected);
    }
  }, [permissions]);

  // 过滤权限
  const filteredPermissions = searchTerm
    ? permissions.filter(p => 
        p.cname.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : permissions;

  // 从权限名称中提取模块名称（冒号前的部分）
  const getModuleFromPermissionName = (name: string): string => {
    const colonIndex = name.indexOf(':');
    return colonIndex > 0 ? name.substring(0, colonIndex) : '其他';
  };

  // 获取所有权限
  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('获取权限数据失败');
      }

      const data = await response.json();
      
      if (data.code === 200) {
        const allPermissions = data.data;
        setPermissions(allPermissions);
        
        const grouped: Record<string, Permission[]> = {};
        allPermissions.forEach((permission: Permission) => {
          const module = getModuleFromPermissionName(permission.name);
          if (!grouped[module]) {
            grouped[module] = [];
          }
          grouped[module].push(permission);
        });
        
        const permissionGroups: PermissionGroup[] = Object.keys(grouped).map(module => ({
          module,
          permissions: grouped[module]
        }));
        
        // 按模块名称排序
        permissionGroups.sort((a, b) => a.module.localeCompare(b.module));
        
        setGroupedPermissions(permissionGroups);
      } else {
        throw new Error('返回数据格式错误');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '数据加载失败',
        description: '获取权限数据时出错',
      });
    }
  };

  // 获取角色已有权限
  const fetchRolePermissions = async () => {
    try {
      console.log(`Fetching permissions for role ${roleId}...`);
      const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('获取角色权限数据失败');
      }

      const data = await response.json();
      
      if (data.code === 200) {
        setSelectedPermissions(data.data.map((item: Permission) => item.id));
      } else {
        throw new Error('返回数据格式错误');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '数据加载失败',
        description: '获取角色已有权限时出错，显示部分示例权限',
      });
    }
  };

  // 保存角色权限
  const saveRolePermissions = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissionIds: selectedPermissions }),
      });

      if (!response.ok) {
        throw new Error('更新角色权限失败');
      }

      const data = await response.json();
      
      if (data.code === 200) {
        toast({
          title: '权限配置成功',
          description: `已成功更新角色 "${role.aliasName}" 的权限配置`,
        });
      } else {
        throw new Error(data.message || '更新角色权限失败');
      }
    } catch (error) {
      console.error('更新角色权限失败:', error);
      toast({
        variant: 'destructive',
        title: '保存失败',
        description: '更新角色权限配置时出错',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 全选/取消全选某个模块的权限
  const toggleModulePermissions = (module: string, checked: boolean) => {
    const modulePermissionIds = groupedPermissions
      .find(g => g.module === module)
      ?.permissions.map(p => p.id) || [];
    
    if (checked) {
      // 添加模块中所有未选中的权限
      const newSelectedPermissions = [
        ...selectedPermissions,
        ...modulePermissionIds.filter(id => !selectedPermissions.includes(id))
      ];
      setSelectedPermissions(newSelectedPermissions);
    } else {
      // 移除模块中所有已选中的权限
      const newSelectedPermissions = selectedPermissions.filter(
        id => !modulePermissionIds.includes(id)
      );
      setSelectedPermissions(newSelectedPermissions);
    }
  };

  // 检查模块是否全选
  const isModuleFullySelected = (module: string) => {
    const modulePermissionIds = groupedPermissions
      .find(g => g.module === module)
      ?.permissions.map(p => p.id) || [];
    
    return modulePermissionIds.length > 0 && 
      modulePermissionIds.every(id => selectedPermissions.includes(id));
  };

  // 检查模块是否部分选中
  const isModuleIndeterminate = (module: string) => {
    const modulePermissionIds = groupedPermissions
      .find(g => g.module === module)
      ?.permissions.map(p => p.id) || [];
    
    const selectedCount = modulePermissionIds.filter(id => 
      selectedPermissions.includes(id)
    ).length;
    
    return selectedCount > 0 && selectedCount < modulePermissionIds.length;
  };

  // 获取模块显示名称
  const getModuleDisplayName = (module: string): string => {
    // 可以在这里添加模块名称的映射表，将英文模块名转为中文显示
    const moduleNameMap: Record<string, string> = {
      system: '系统管理',
      user: '用户管理',
      order: '订单管理',
      product: '产品管理',
      finance: '财务管理',
      report: '报表统计',
      // 在这里添加更多映射
    };
    
    return moduleNameMap[module] || module;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">加载中...</h1>
          <p className="text-muted-foreground">请稍候，正在加载权限数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/admin/roles')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回角色列表
        </Button>
        <div>
          <h1 className="text-3xl font-bold">角色权限配置</h1>
          <p className="text-muted-foreground mt-1">
            为 <span className="font-medium">{role.name}</span> 配置访问权限和操作权限
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="relative w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索权限..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          onClick={saveRolePermissions}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存权限配置
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="all">所有权限</TabsTrigger>
          {groupedPermissions.map(group => (
            <TabsTrigger key={group.module} value={group.module}>
              {getModuleDisplayName(group.module)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>所有系统权限</CardTitle>
              <CardDescription>
                请选择要分配给该角色的权限，按功能模块分组。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {groupedPermissions.map((group) => (
                <div key={group.module} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`select-all-${group.module}`}
                      checked={isModuleFullySelected(group.module)}
                      data-indeterminate={isModuleIndeterminate(group.module)}
                      onCheckedChange={(checked) => {
                        toggleModulePermissions(group.module, !!checked);
                      }}
                    />
                    <label 
                      htmlFor={`select-all-${group.module}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {getModuleDisplayName(group.module)} (全选)
                    </label>
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.permissions.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-2">
                        <Checkbox 
                          id={`permission-${permission.id}`}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPermissions([...selectedPermissions, permission.id]);
                            } else {
                              setSelectedPermissions(
                                selectedPermissions.filter((id) => id !== permission.id)
                              );
                            }
                          }}
                        />
                        <div className="grid gap-1">
                          <label
                            htmlFor={`permission-${permission.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {permission.cname}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {permission.name}
                          </p>
                          {permission.description && (
                            <p className="text-xs text-muted-foreground italic">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button 
                onClick={saveRolePermissions}
                disabled={isSaving}
                className="ml-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存配置
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {groupedPermissions.map((group) => (
          <TabsContent key={group.module} value={group.module}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{getModuleDisplayName(group.module)} 模块权限</CardTitle>
                    <CardDescription>
                      管理 {getModuleDisplayName(group.module)} 模块下的权限配置
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`tab-select-all-${group.module}`}
                      checked={isModuleFullySelected(group.module)}
                      data-indeterminate={isModuleIndeterminate(group.module)}
                      onCheckedChange={(checked) => {
                        toggleModulePermissions(group.module, !!checked);
                      }}
                    />
                    <label 
                      htmlFor={`tab-select-all-${group.module}`}
                      className="text-sm font-medium leading-none"
                    >
                      全选
                    </label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <Checkbox 
                        id={`tab-permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id]);
                          } else {
                            setSelectedPermissions(
                              selectedPermissions.filter((id) => id !== permission.id)
                            );
                          }
                        }}
                      />
                      <div className="grid gap-1">
                        <label
                          htmlFor={`tab-permission-${permission.id}`}
                          className="text-sm font-medium leading-none"
                        >
                          {permission.cname}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {permission.name}
                        </p>
                        {permission.description && (
                          <p className="text-xs text-muted-foreground italic">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button 
                  onClick={saveRolePermissions}
                  disabled={isSaving}
                  className="ml-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存配置
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 