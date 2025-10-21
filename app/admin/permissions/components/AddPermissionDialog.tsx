'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// 表单验证模式
const permissionFormSchema = z.object({
  name: z.string()
    .min(3, "权限标识符至少需要3个字符")
    .max(50, "权限标识符不能超过50个字符")
    .regex(/^[a-zA-Z0-9_:]+$/, "权限标识符只能包含字母、数字、下划线和冒号"),
  cname: z.string()
    .min(2, "权限名称至少需要2个字符")
    .max(20, "权限名称不能超过20个字符"),
  description: z.string()
    .max(100, "描述不能超过100个字符")
    .optional(),
  module: z.string({
    required_error: "请选择所属模块",
  }),
  resource: z.string()
    .min(2, "资源类型至少需要2个字符")
    .max(20, "资源类型不能超过20个字符")
    .optional(),
  action: z.string({
    required_error: "请选择操作类型",
  })
});

type PermissionFormValues = z.infer<typeof permissionFormSchema>;

interface AddPermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  token: string;
}

export function AddPermissionDialog({
  isOpen,
  onClose,
  onSuccess,
  token
}: AddPermissionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // 模块选项
  const moduleOptions = [
    { value: "system", label: "系统管理" },
    { value: "user", label: "用户管理" },
    { value: "order", label: "订单管理" },
    { value: "product", label: "产品管理" },
    { value: "finance", label: "财务管理" },
    { value: "report", label: "报表统计" },
  ];

  // 操作类型选项
  const actionOptions = [
    { value: "create", label: "创建" },
    { value: "read", label: "读取" },
    { value: "update", label: "更新" },
    { value: "delete", label: "删除" },
    { value: "manage", label: "管理" },
    { value: "export", label: "导出" },
    { value: "import", label: "导入" },
  ];

  // 表单默认值
  const defaultValues: Partial<PermissionFormValues> = {
    name: "",
    cname: "",
    description: "",
    module: "",
    resource: "",
    action: ""
  };

  // 初始化表单
  const form = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues,
  });

  // 监听模块和操作的变化，自动生成权限标识符
  const moduleValue = form.watch("module");
  const actionValue = form.watch("action");
  const resourceValue = form.watch("resource");

  // 当模块、资源或操作改变时，自动更新权限标识符
  const updatePermissionName = () => {
    if (moduleValue && actionValue) {
      let permName = `${moduleValue}:${actionValue}`;
      if (resourceValue) {
        permName += `:${resourceValue}`;
      }
      form.setValue("name", permName.toUpperCase());
    }
  };

  // 表单提交处理
  const onSubmit = async (data: PermissionFormValues) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/permissions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.code === 200) {
        setSubmitStatus("success");
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
          toast({
            title: "创建成功",
            description: `权限 ${data.cname} 已成功创建`,
          });
        }, 1500);
      } else {
        setSubmitStatus("error");
        setErrorMessage(result.message || "创建权限失败");
      }
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage("发生网络错误，请稍后再试");
      console.error("创建权限出错:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加新权限</DialogTitle>
          <DialogDescription>
            创建一个新的系统权限。权限创建后可分配给角色使用。
          </DialogDescription>
        </DialogHeader>
        
        {submitStatus === "success" ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-center">权限创建成功！</h3>
            <p className="text-sm text-gray-500 text-center">
              新权限已成功添加到系统，可以在角色权限配置中使用。
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {submitStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>创建失败</AlertTitle>
                  <AlertDescription>
                    {errorMessage || "创建权限时发生错误，请检查输入并重试。"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="module"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>所属模块</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setTimeout(updatePermissionName, 0);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择所属模块" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {moduleOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>操作类型</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setTimeout(updatePermissionName, 0);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择操作类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {actionOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="resource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>资源类型（可选）</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="如：USER, ROLE, ORDER 等" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            setTimeout(updatePermissionName, 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>权限标识符</FormLabel>
                      <FormControl>
                        <Input placeholder="如：SYSTEM:CREATE:USER" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>权限名称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入权限名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>权限描述</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="请输入权限描述" 
                          {...field} 
                          className="resize-none" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "创建权限"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
} 