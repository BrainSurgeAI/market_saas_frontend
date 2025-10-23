'use client';

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Permission } from "@/app/types/permissionTypes";

// 表单验证模式
const editPermissionFormSchema = z.object({
  name: z.string()
    .min(3, "权限标识符至少需要3个字符")
    .max(50, "权限标识符不能超过50个字符")
    .regex(/^[a-zA-Z0-9_:]+$/, "权限标识符只能包含字母、数字、下划线和冒号"),
  cname: z.string()
    .min(2, "权限名称至少需要2个字符")
    .max(20, "权限名称不能超过20个字符"),
  description: z.string()
    .max(100, "描述不能超过100个字符")
    .nullable()
    .optional(),
  pathPattern: z.string()
    .min(1, "路径模式不能为空")
    .max(100, "路径模式不能超过100个字符")
    .regex(/^\/api\/.*$/, "路径模式必须以 /api/ 开头"),
  httpMethod: z.string({
    required_error: "请选择HTTP方法",
  }),
  selfOnly: z.boolean().default(false)
});

type EditPermissionFormValues = z.infer<typeof editPermissionFormSchema>;

interface EditPermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  token: string;
  permission: Permission | null;
}

export function EditPermissionDialog({
  isOpen,
  onClose,
  onSuccess,
  token,
  permission
}: EditPermissionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // HTTP方法选项
  const httpMethodOptions = [
    { value: "GET", label: "GET" },
    { value: "POST", label: "POST" },
    { value: "PUT", label: "PUT" },
    { value: "DELETE", label: "DELETE" },
    { value: "PATCH", label: "PATCH" },
  ];

  // 初始化表单
  const form = useForm<EditPermissionFormValues>({
    resolver: zodResolver(editPermissionFormSchema),
    defaultValues: {
      name: "",
      cname: "",
      description: "",
      pathPattern: "",
      httpMethod: "",
      selfOnly: false
    },
  });

  // 当权限数据改变时，更新表单值
  useEffect(() => {
    if (permission) {
      form.reset({
        name: permission.name,
        cname: permission.cname || "",
        description: permission.description || "",
        pathPattern: permission.pathPattern || "",
        httpMethod: permission.httpMethod || "",
        selfOnly: permission.selfOnly === 1
      });
    }
  }, [permission, form]);

  
  // 表单提交处理
  const onSubmit = async (data: EditPermissionFormValues) => {
    if (!permission) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      // 转换数据格式以匹配API期望
      const submitData = {
        name: data.name,
        cname: data.cname,
        description: data.description,
        pathPattern: data.pathPattern,
        httpMethod: data.httpMethod,
        self_only: data.selfOnly ? 1 : 0  // 将布尔值转换为数字
      };

      const response = await fetch(`/api/admin/permissions/${permission.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok && result.code === 200) {
        setSubmitStatus("success");
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
          toast({
            title: "修改成功",
            description: `权限 ${data.cname} 已成功更新`,
          });
        }, 1500);
      } else {
        setSubmitStatus("error");
        const errorMessage = result.message || "修改权限失败";
        const errorDetails = result.details ? `\n详细信息: ${JSON.stringify(result.details)}` : "";
        setErrorMessage(errorMessage + errorDetails);

        // 显示更详细的错误提示
        toast({
          variant: "destructive",
          title: "修改失败",
          description: errorMessage,
        });
      }
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage("发生网络错误，请稍后再试");
      console.error("修改权限出错:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑权限</DialogTitle>
          <DialogDescription>
            修改权限配置信息。保存后将在所有相关角色中生效。
          </DialogDescription>
        </DialogHeader>

        {submitStatus === "success" ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-center">权限修改成功！</h3>
            <p className="text-sm text-gray-500 text-center">
              权限配置已成功更新，相关角色权限也会同步更新。
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {submitStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>修改失败</AlertTitle>
                  <AlertDescription>
                    {errorMessage || "修改权限时发生错误，请检查输入并重试。"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 py-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pathPattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API路径模式</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="如：/api/v1/users"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="httpMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HTTP方法</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择HTTP方法" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {httpMethodOptions.map((option) => (
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
                  name="selfOnly"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          仅限自己访问
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          勾选后，用户只能访问自己的资源数据
                        </p>
                      </div>
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
                    "保存修改"
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