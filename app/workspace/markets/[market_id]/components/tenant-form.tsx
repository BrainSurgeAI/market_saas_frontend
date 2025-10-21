'use client'

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Organization } from "@/app/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Category } from '@/app/workspace/types';
import { useToast } from "@/hooks/use-toast";

// 租户表单验证模式
export const tenantFormSchema = z.object({
  name: z.string()
    .trim()
    .min(6, "租户名称不能少于6个字符")
    .max(255, "租户名称不能超过255个字符"),
  address: z.string()
    .trim()
    .min(6, "地址不能少于6个字符")
    .max(64, "地址不能超过64个字符")
    .refine(
      val => /^[a-zA-Z0-9\u4e00-\u9fa5\s,.'()#-]+$/.test(val),
      "地址只能包含中文、英文、数字和常用标点符号"
    ),
  tenantType: z.enum(["CUSTOMER", "PROVIDER", "MARKET"], {
    required_error: "请选择租户类型",
  }),
  businessScope: z.string()
    .max(128, "业务范围不能超过128个字符")
    .optional(),
});

export type TenantFormValues = z.infer<typeof tenantFormSchema>;

export interface TenantFormProps {
  marketId: string;
  defaultValues?: Partial<TenantFormValues>;
  tenant?: Organization;
  isLoading: boolean;
  mode: 'create' | 'edit';
  onSubmit: (data: TenantFormValues) => Promise<void>;
  onCancel: () => void;
  business_scope: Category[];
}

// 辅助函数：获取租户类型对应的中文名称
export const getTenantTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    'CUSTOMER': '客户',
    'PROVIDER': '供应商',
    'MARKET': '市场',
  };
  return typeMap[type] || type;
};

export function TenantForm({
  defaultValues = {
    name: "",
    address: "",
  },
  tenant,
  isLoading,
  mode,
  onSubmit,
  onCancel,
  business_scope = []
}: TenantFormProps) {
  
  // 获取toast函数
  const { toast } = useToast();
  
  // 初始化表单
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      ...defaultValues,
      // 如果是编辑模式，使用租户数据填充
      ...(tenant && {
        name: tenant.name,
        address: tenant.address,
        tenantType: tenant.tenantType as "CUSTOMER" | "PROVIDER" | "MARKET",
        businessScope: tenant.businessScope || "",
      }),
    },
  });

  // 用于存储已选择的业务范围
  const [selectedBusinessScopes, setSelectedBusinessScopes] = useState<number[]>([]);
  
  // 监听租户类型变化
  const tenantType = form.watch("tenantType");
  const isProvider = tenantType === "PROVIDER";
  
  // 初始化已选择的业务范围
  useEffect(() => {
    if (tenant?.businessScope && isProvider) {
      const scopes = tenant.businessScope.split(",");
      const scopeIds = business_scope
        .filter(item => scopes.includes(item.level_one_category))
        .map(item => item.id);
      setSelectedBusinessScopes(scopeIds);
    } else {
      setSelectedBusinessScopes([]);
    }
  }, [tenant, isProvider, business_scope]);
  
  // 处理业务范围选择变化
  const handleBusinessScopeChange = (id: number, checked: boolean) => {
    if (checked) {
      if (selectedBusinessScopes.length >= 5) {
        toast({
          title: "选择超出限制",
          description: "最多只能选择5个业务类型",
          variant: "destructive",
        });
        return;
      }
      setSelectedBusinessScopes(prev => [...prev, id]);
    } else {
      setSelectedBusinessScopes(prev => prev.filter(item => item !== id));
    }
  };
  
  // 表单提交前处理业务范围
  const handleSubmit = async (data: TenantFormValues) => {
    // 如果是供应商类型，处理业务范围
    if (data.tenantType === "PROVIDER" && selectedBusinessScopes.length > 0) {
      const selectedCategories = business_scope
        .filter(item => selectedBusinessScopes.includes(item.id))
        .map(item => item.level_one_category);
      
      // 拼接业务范围字符串
      const scopeString = selectedCategories.join(",");
      
      // 检查长度并截断（如果需要）
      if (scopeString.length > 128) {
        // 找到最后一个可以包含的完整类别，确保不会截断到一半
        let truncatedString = "";
        let currentLength = 0;
        
        for (const category of selectedCategories) {
          // 加上逗号的长度（如果不是第一个类别）
          const separator = truncatedString ? "," : "";
          const nextLength = currentLength + separator.length + category.length;
          
          if (nextLength <= 128) {
            truncatedString = truncatedString ? `${truncatedString}${separator}${category}` : category;
            currentLength = nextLength;
          } else {
            break; // 超出长度限制，停止添加
          }
        }
        
        data.businessScope = truncatedString;
        
        // 显示警告提示
        toast({
          title: "业务范围已截断",
          description: "选择的业务范围过多，已自动截断以符合字符限制",
          variant: "destructive",
          duration: 3000,
        });
      } else {
        data.businessScope = scopeString;
      }
    } else {
      data.businessScope = "";
    }
    
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="grid grid-cols-4 items-center gap-4">
                <FormLabel className="text-right">租户名称</FormLabel>
                <div className="col-span-3">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tenantType"
            render={({ field }) => (
              <FormItem className="grid grid-cols-4 items-center gap-4">
                <FormLabel className="text-right">租户类型</FormLabel>
                <div className="col-span-3">
                  {mode === 'edit' ? (
                    // 编辑模式下显示禁用但可见的租户类型
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={getTenantTypeText(field.value)}
                        className="bg-gray-100"
                        disabled
                      />
                      <input type="hidden" {...field} />
                    </div>
                  ) : (
                    // 创建模式下允许选择租户类型，但不设置默认值
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择租户类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CUSTOMER">客户</SelectItem>
                          <SelectItem value="PROVIDER">供应商</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  )}
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="grid grid-cols-4 items-center gap-4">
                <FormLabel className="text-right">地址</FormLabel>
                <div className="col-span-3">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          
          {/* 业务范围多选 - 仅当租户类型为供应商时显示 */}
          {isProvider && (
            <FormField
              control={form.control}
              name="businessScope"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-start gap-4">
                  <FormLabel className="text-right pt-2">业务范围</FormLabel>
                  <div className="col-span-3">
                    <FormDescription className="mb-2">
                      请选择供应商的业务范围（最多5个）
                    </FormDescription>
                    <ScrollArea className="h-[180px] border rounded-md p-2">
                      <div className="grid grid-cols-2 gap-2">
                        {business_scope.map((scope) => (
                          <div key={scope.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`scope-${scope.id}`}
                              checked={selectedBusinessScopes.includes(scope.id)}
                              onCheckedChange={(checked) => 
                                handleBusinessScopeChange(scope.id, checked === true)
                              }
                            />
                            <label
                              htmlFor={`scope-${scope.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {scope.level_one_category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    {selectedBusinessScopes.length > 0 ? (
                      <p className="text-xs text-muted-foreground mt-2">
                        已选择 {selectedBusinessScopes.length}/5 项
                      </p>
                    ) : (
                      <p className="text-xs text-amber-500 mt-2">
                        请至少选择一项业务范围
                      </p>
                    )}
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          )}
        </div>
        <DialogFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || (isProvider && selectedBusinessScopes.length === 0)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? '创建租户' : '保存修改'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
} 