'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { TokenPayload } from "@/app/models";

import { Role } from "@/app/types/roleTypes";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Edit, 
  MoreHorizontal, 
  Plus, 
  Trash2, 
  UserPlus,
  Shield
} from "lucide-react";
import { EditRoleDialog } from "./edit-role-dialog";

interface RolesClientProps {
  token: string;
}

export default function RolesClient({ token }: RolesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState<{
    name: string;
    aliasName: string;
    tenantType: string | null;
  }>({
    name: '',
    aliasName: '',
    tenantType: null
  });

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
      
      // 从API获取角色数据
      fetchRoles();
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '令牌无效',
        description: '请重新登录',
      });
      router.push('/admin/login');
    }
  }, [router, toast, token]);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('获取角色数据失败');
      }

      const data = await response.json();
      
      if (data.code === 200 && Array.isArray(data.data)) {
        setRoles(data.data);
      } else {
        throw new Error('返回数据格式错误');
      }
    } catch (error) {
      console.error('获取角色数据失败:', error);
      toast({
        variant: 'destructive',
        title: '数据加载失败',
        description: '获取角色数据时出错',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async () => {
    try {
      // 在实际应用中，这里应该调用API创建角色
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRole),
      });

      if (!response.ok) {
        throw new Error('创建角色失败');
      }

      const data = await response.json();
      
      if (data.code === 200) {
        // 刷新角色列表
        fetchRoles();
        setIsAddDialogOpen(false);
        toast({
          title: '角色创建成功',
          description: `角色 "${newRole.aliasName}" 已成功创建`,
        });
      } else {
        throw new Error(data.message || '创建角色失败');
      }
    } catch (error) {
      console.error('创建角色失败:', error);
      toast({
        variant: 'destructive',
        title: '创建失败',
        description: '创建角色时出错',
      });
    }
  };

  const handleDeleteRole = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/roles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('删除角色失败');
      }

      const data = await response.json();
      
      if (data.code === 200) {
        // 更新本地状态
        setRoles(roles.filter(role => role.id !== id));
        toast({
          title: '角色删除成功',
          description: '角色已成功删除',
        });
      } else {
        throw new Error(data.message || '删除角色失败');
      }
    } catch (error) {
      console.error('删除角色失败:', error);
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: '删除角色时出错',
      });
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditDialogOpen(true);
  };

  const getTenantTypeLabel = (type: string | null) => {
    switch(type) {
      case 'MARKET': return '市场';
      case 'PROVIDER': return '供应商';
      case 'CUSTOMER': return '客户';
      default: return '通用';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">加载中...</h1>
          <p className="text-muted-foreground">请稍候，正在加载角色数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">角色管理</h1>
          <p className="text-muted-foreground mt-1">管理系统中的所有角色和权限分配</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加角色
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>系统角色列表</CardTitle>
              <CardDescription>查看和管理所有已定义的系统角色</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>角色名称</TableHead>
                <TableHead>角色标识</TableHead>
                <TableHead>租户类型</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.aliasName}</TableCell>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{getTenantTypeLabel(role.tenantType)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">打开菜单</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRole(role)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>编辑角色</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/roles/${role.id}/permissions`)}>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>权限设置</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/roles/${role.id}/users`)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>分配用户</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive" 
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>删除角色</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>添加新角色</DialogTitle>
            <DialogDescription>
              创建一个新的系统角色并定义其基本信息。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                角色标识
              </Label>
              <Input
                id="name"
                value={newRole.name}
                onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                className="col-span-3"
                placeholder="SYSTEM_OPERATOR"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alias" className="text-right">
                角色名称
              </Label>
              <Input
                id="alias"
                value={newRole.aliasName}
                onChange={(e) => setNewRole({...newRole, aliasName: e.target.value})}
                className="col-span-3"
                placeholder="系统操作员"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tenant" className="text-right">
                租户类型
              </Label>
              <Select
                value={newRole.tenantType || 'none'}
                onValueChange={(value) => setNewRole({...newRole, tenantType: value === 'none' ? null : value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择租户类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">通用</SelectItem>
                  <SelectItem value="MARKET">市场</SelectItem>
                  <SelectItem value="PROVIDER">供应商</SelectItem>
                  <SelectItem value="CUSTOMER">客户</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
            <Button type="submit" onClick={handleAddRole}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditRoleDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        role={selectedRole}
        token={token}
        onSuccess={fetchRoles}
      />
    </div>
  );
} 