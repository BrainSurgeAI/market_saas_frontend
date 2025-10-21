"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  EditIcon, 
  Trash2Icon, 
  AlertCircle,
  UserIcon,
  InfoIcon,
  Undo2Icon
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User } from "@/app/models";
import { EditUserDialog } from "./EditUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";


interface UsersListProps {
  tenant_hash: string;
  marketId: string;
  tenantType: string;
  onCreateUser: () => void;
  onAdminStatusChange?: (hasAdminUser: boolean) => void;
}

export function UsersList({ 
  tenant_hash: tenantId, 
  marketId, 
  tenantType,
  onCreateUser, 
  onAdminStatusChange 
}: UsersListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | undefined>();
  
  // 编辑用户相关状态
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  
  // 删除用户相关状态
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);

  // 获取用户角色中文名称
  const getRoleName = (role: string): string => {
    const roleMap: Record<string, string> = {
      'PROVIDER_ADMIN': '管理员',
      'PROVIDER': '用户',
      'CUSTOMER_ADMIN': '管理员',
      'ORDER_CREATOR': '采购员',
    };
    return roleMap[role] || role;
  };

  // 获取用户角色徽章样式
  const getRoleBadgeVariant = (role: string): "default" | "outline" | "secondary" | "destructive" => {
    if (role.includes('ADMIN')) {
      return "destructive";
    } else {
      return "secondary";
    }
  };

  // 获取用户状态徽章
  const getUserStatusBadge = (user: User) => {
    if (user.deletedAt) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-500">已禁用</Badge>;
    }
    return null;
  };

  // 格式化时间
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "未知";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/markets/${marketId}/tenants/${tenantId}/users`);
      
      if (!response.ok) {
        throw new Error('获取用户列表失败');
      }
      
      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        setUsers(data.data);
        const adminUser = data.data.find((user: User) => 
          user.role.includes('ADMIN')
        );
        const hasAdminUser = !!adminUser;
        setHasAdmin(hasAdminUser);
        
        if (adminUser) {
          setAdminUserId(adminUser.id);
        }
        
        if (onAdminStatusChange) {
          onAdminStatusChange(hasAdminUser);
        }
      } else {
        throw new Error(data.message || '获取用户数据出错');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '获取用户列表时发生错误');
      console.error('获取用户列表出错:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 组件加载时获取用户列表
  useEffect(() => {
    fetchUsers();
  }, [tenantId, marketId]);

  // 刷新用户列表
  const handleRefresh = () => {
    fetchUsers();
  };

  // 打开编辑用户对话框
  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);
    setIsEditUserDialogOpen(true);
  };

  // 关闭编辑用户对话框
  const closeEditUserDialog = () => {
    setIsEditUserDialogOpen(false);
    setSelectedUser(null);
  };
  
  // 打开删除用户对话框
  const openDeleteUserDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteUserDialogOpen(true);
  };
  
  // 关闭删除用户对话框
  const closeDeleteUserDialog = () => {
    setIsDeleteUserDialogOpen(false);
    setUserToDelete(null);
  };

  // 用户更新或删除成功后刷新列表
  const handleUserUpdated = () => {
    fetchUsers();
  };

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>获取用户数据失败</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={handleRefresh}
        >
          重试
        </Button>
      </Alert>
    );
  }

  // 渲染空状态
  if (users.length === 0) {
    return (
      <div className="p-12 border rounded-md flex flex-col items-center justify-center text-center text-gray-500">
        <UserIcon className="h-10 w-10 mb-2 text-gray-400" />
        <p className="text-sm font-medium">还没有用户</p>
        <p className="text-xs mt-1 mb-4">这个租户还没有添加任何用户</p>
        <Button onClick={onCreateUser}>创建第一个用户</Button>
      </div>
    );
  }

  // 渲染用户列表
  return (
    <div className="space-y-4">
      {hasAdmin && (
        <Alert className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertTitle>管理员用户限制</AlertTitle>
          <AlertDescription className="text-blue-700">
            每个租户只能有一个管理员用户。您已创建了管理员用户，无法再创建其他管理员角色的用户。
          </AlertDescription>
        </Alert>
      )}
      
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="w-[200px]">姓名/用户名</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>联系方式</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="text-xs">
              <TableCell className="font-medium">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{user.name}</p>
                    {getUserStatusBadge(user)}
                  </div>
                  <p className="text-gray-500 text-xs">{user.username}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getRoleName(user.role)}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-xs">{user.email}</p>
                  <p className="text-gray-500 text-xs">{user.phone}</p>
                </div>
              </TableCell>
              <TableCell className="text-xs">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditUserDialog(user)}
                    title="编辑用户"
                    disabled={!!user.deletedAt}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={user.deletedAt ? "text-gray-400 hover:bg-gray-50" : "text-red-500 hover:bg-red-50"}
                    onClick={() => openDeleteUserDialog(user)}
                    title={user.deletedAt ? "恢复" : "禁用"}
                  >
                    {user.deletedAt?  <Undo2Icon className="h-4 w-4" /> : <Trash2Icon className="h-4 w-4" />}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          刷新
        </Button>
      </div>

      {/* 编辑用户对话框 */}
      <EditUserDialog
        isOpen={isEditUserDialogOpen}
        onClose={closeEditUserDialog}
        user={selectedUser}
        tenantId={tenantId}
        tenantType={tenantType}
        marketId={marketId}
        hasAdmin={hasAdmin}
        adminUserId={adminUserId}
      />
      
      {/* 删除用户确认对话框 */}
      <DeleteUserDialog
        isOpen={isDeleteUserDialogOpen}
        onClose={closeDeleteUserDialog}
        user={userToDelete}
        tenantId={tenantId}
        marketId={marketId}
        onUserDeleted={handleUserUpdated}
      />
    </div>
  );
} 