"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// 表单验证模式
const userFormSchema = z.object({
  name: z.string().min(2, "姓名至少需要2个字符").max(16, "姓名不能超过16个字符"),
  username: z
    .string()
    .min(3, "用户名至少需要3个字符")
    .max(16, "用户名不能超过16个字符")
    .regex(/^[a-zA-Z0-9_-]+$/, "用户名只能包含字母、数字、下划线和连字符"),
  password:  z.string()
  .min(8, "密码至少8个字符")
  .max(16, "密码最多16个字符")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?!.*\s)[a-zA-Z0-9!@#$%^&*(),.?":{}|<>]{8,}$/,
    "密码必须包含至少一个大小写字母和一个特殊字符，且不能包含空格"
  ),
  email: z.string().email("请输入有效的电子邮件地址"),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, "请输入有效的手机号码"),
  role: z.string({
    required_error: "请选择用户角色",
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantType: string;
  marketId: string;
  hasAdmin?: boolean;
}

export function CreateUserDialog({
  isOpen,
  onClose,
  tenantId,
  tenantType,
  marketId,
  hasAdmin = false,
}: CreateUserDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  // 角色选项基于租户类型
  const roleOptions = tenantType === "PROVIDER"
    ? [
        { value: "PROVIDER_ADMIN", label: "供应商管理员", adminRole: true },
        { value: "STAFF", label: "用户", adminRole: false },
      ]
    : tenantType === "CUSTOMER"
    ? [
        { value: "CUSTOMER_ADMIN", label: "管理员", adminRole: true },
        { value: "ORDER_CREATOR", label: "采购员", adminRole: false },
      ]
    : [];

  // 过滤角色选项，如果已有管理员则排除管理员角色
  const filteredRoleOptions = hasAdmin 
    ? roleOptions.filter(role => !role.adminRole)
    : roleOptions;

  // 表单默认值
  const defaultValues: Partial<UserFormValues> = {
    name: "",
    username: "",
    password: "",
    email: "",
    phone: "",
    role: "",
  };

  // 初始化表单
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  });

  // 表单提交时重置角色，如果选择了管理员角色但已有管理员
  useEffect(() => {
    if (hasAdmin && form.getValues().role) {
      const currentRole = form.getValues().role;
      const isAdminRole = roleOptions.find(r => r.value === currentRole)?.adminRole;
      if (isAdminRole) {
        form.setValue('role', '');
      }
    }
  }, [hasAdmin, form, roleOptions]);

  // 表单提交处理
  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/markets/${marketId}/tenants/${tenantId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.code === 200) {
        setSubmitStatus("success");
        setTimeout(() => {
          onClose();
          router.refresh(); // 刷新页面数据
          toast({
            title: "创建成功",
            description: `用户 ${data.name}(${data.username}) 已成功创建`,
          });
        }, 1500);
      } else {
        setSubmitStatus("error");
        setErrorMessage(result.message || "创建用户失败");
      }
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage("发生网络错误，请稍后再试");
      console.error("创建用户出错:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建新用户</DialogTitle>
          <DialogDescription>
            为租户创建一个新的用户账号。用户创建后将能够登录系统。
            {hasAdmin && (
              <span className="mt-2 block text-xs text-amber-600">
                注意：该租户已有管理员用户，不能再创建管理员角色。
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {submitStatus === "success" ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-center">用户创建成功！</h3>
            <p className="text-sm text-gray-500 text-center">
              新用户已成功添加到系统，并可以开始使用平台功能。
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
                    {errorMessage || "创建用户时发生错误，请检查输入并重试。"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>姓名</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>用户名</FormLabel>
                        <FormControl>
                          <Input placeholder="登录用户名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>密码</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="输入用户密码"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>电子邮箱</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="user@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>手机号码</FormLabel>
                        <FormControl>
                          <Input placeholder="13xxxxxxxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户角色</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          // 如果选择了管理员角色但已存在管理员，不允许选择
                          const isAdminRole = roleOptions.find(r => r.value === value)?.adminRole;
                          if (isAdminRole && hasAdmin) {
                            return;
                          }
                          field.onChange(value);
                        }}
                        defaultValue={field.value}
                        disabled={isChecking}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择用户角色" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredRoleOptions.map((role) => (
                            <SelectItem 
                              key={role.value} 
                              value={role.value}
                            >
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {hasAdmin && !field.value && (
                        <p className="text-xs text-amber-600 mt-1">
                          每个租户只能有一个管理员用户。
                        </p>
                      )}
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
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  创建用户
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
} 