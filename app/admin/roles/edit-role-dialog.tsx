'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@/app/types/roleTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  token: string;
  onSuccess: () => void;
}

export function EditRoleDialog({
  open,
  onOpenChange,
  role,
  token,
  onSuccess,
}: EditRoleDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    aliasName: string;
    tenantType: string | null;
  }>({
    name: '',
    aliasName: '',
    tenantType: null,
  });

  // 当角色数据变化时更新表单
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        aliasName: role.aliasName,
        tenantType: role.tenantType,
      });
    }
  }, [role]);

  const handleSubmit = async () => {
    if (!role) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/roles/${role.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('更新角色失败');
      }

      const data = await response.json();
      
      if (data.code === 200) {
        toast({
          title: '角色更新成功',
          description: `角色 "${formData.aliasName}" 已成功更新`,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(data.message || '更新角色失败');
      }
    } catch (error) {
      console.error('更新角色失败:', error);
      toast({
        variant: 'destructive',
        title: '更新失败',
        description: '更新角色信息时出错',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑角色</DialogTitle>
          <DialogDescription>
            修改角色的基本信息，点击保存完成编辑。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="text-right">
              角色标识
            </Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3"
              placeholder="SYSTEM_OPERATOR"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-alias" className="text-right">
              角色名称
            </Label>
            <Input
              id="edit-alias"
              value={formData.aliasName}
              onChange={(e) => setFormData({ ...formData, aliasName: e.target.value })}
              className="col-span-3"
              placeholder="系统操作员"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-tenant" className="text-right">
              租户类型
            </Label>
            <Select
              value={formData.tenantType || 'none'}
              onValueChange={(value) => setFormData({ ...formData, tenantType: value === 'none' ? null : value })}
            >
              <SelectTrigger id="edit-tenant" className="col-span-3">
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            取消
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 