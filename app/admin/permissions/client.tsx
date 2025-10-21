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
import { Plus, Search } from 'lucide-react';
import { Permission } from '@/app/types/permissionTypes';
import { AddPermissionDialog } from './components/AddPermissionDialog';

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

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.cname.includes(searchTerm)
  );

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

  const handleAddPermissionSuccess = () => {
    fetchPermissions(); // 刷新权限列表
  };

  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    const category = permission.name.split(':')[0];
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">权限管理</h1>
          <p className="text-muted-foreground mt-1">管理系统权限和资源访问控制</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSavePermissions}>保存权限设置</Button>
          <Button variant="outline" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            添加权限
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="搜索权限名称、代码或描述..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {Object.entries(groupedPermissions).map(([category, perms]) => (
        <Card key={category} className="mb-6">
          <CardHeader>
            <CardTitle>{category}</CardTitle>
            <CardDescription>管理{category}相关的所有权限</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">选择</TableHead>
                  <TableHead>权限代码</TableHead>
                  <TableHead>权限名称</TableHead>
                  <TableHead className="hidden md:table-cell">描述</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perms.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{permission.name}</TableCell>
                    <TableCell>{permission.cname}</TableCell>
                    <TableCell className="hidden md:table-cell">{permission.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <AddPermissionDialog 
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleAddPermissionSuccess}
        token={token}
      />
    </div>
  );
} 