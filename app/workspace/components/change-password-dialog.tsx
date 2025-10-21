"use client";

import { useState, useEffect, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// 表单验证模式
const passwordFormSchema = z.object({
  currentPassword: z.string()
    .min(8, "当前密码至少需要8个字符"),
  newPassword: z.string()
    .min(8, "密码至少8个字符")
    .max(16, "密码最多16个字符")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?!.*\s)[a-zA-Z0-9!@#$%^&*(),.?":{}|<>]{8,}$/,
      "密码必须包含至少一个大小写字母和一个特殊字符，且不能包含空格"
    ),
  confirmPassword: z.string()
    .min(8, "确认密码至少需要8个字符"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "新密码与确认密码不匹配",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export function ChangePasswordDialog({
  isOpen,
  onClose,
  username
}: ChangePasswordDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // 表单默认值
  const defaultValues: Partial<PasswordFormValues> = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  };

  // 初始化表单
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues,
  });

  // 重置表单和状态
  const resetForm = () => {
    form.reset(defaultValues);
    setSubmitStatus("idle");
    setErrorMessage("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // 监听对话框打开关闭状态
  useEffect(() => {
    if (!isOpen) {
      // 对话框关闭时，延迟重置表单，确保动画完成
      const timer = setTimeout(() => {
        resetForm();
        // 确保修复dialog关闭后的focus陷阱问题
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.tagName === 'BUTTON') {
          activeElement.blur();
        }
        // 修复可能的pointerEvents问题
        document.body.style.pointerEvents = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 处理对话框关闭
  const handleClose = () => {
    // 先重置焦点，然后再关闭对话框
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement?.tagName === 'BUTTON') {
      activeElement.blur();
    }
    
    // 重置body样式，防止其保持未定义的状态
    document.body.style.pointerEvents = '';
    
    // 通知父组件关闭
    onClose();
  };

  // 表单提交处理
  const onSubmit = async (data: PasswordFormValues) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/users/${username}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setSubmitStatus("error");
        setErrorMessage(errorData.message || "密码修改失败");
        return;
      }

      // 成功处理
      setSubmitStatus("success");
      toast({
        variant: "success",
        title: "密码修改成功",
        description: "您的密码已成功更新",
      });
      
      // 延迟关闭对话框
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage("发生网络错误，请稍后再试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowPassword = (field: 'current' | 'new' | 'confirm') => {
    if (field === 'current') {
      setShowCurrentPassword(!showCurrentPassword);
    } else if (field === 'new') {
      setShowNewPassword(!showNewPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      modal={true}
    >
      <DialogContent className="sm:max-w-[500px]" ref={dialogRef}>
        <DialogHeader>
          <DialogTitle>修改密码</DialogTitle>
          <DialogDescription>
            更新您的账户密码，请确保使用强密码以保护您的账户安全。
          </DialogDescription>
        </DialogHeader>

        {submitStatus === "success" ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-center">密码修改成功！</h3>
            <p className="text-sm text-gray-500 text-center">
              您的密码已成功更新，下次登录时请使用新密码。
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
                    {errorMessage || "密码修改失败，请确认当前密码是否正确。"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>当前密码</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="请输入当前密码"
                            type={showCurrentPassword ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute top-0 right-0 h-full px-3 flex items-center"
                          onClick={() => toggleShowPassword('current')}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>新密码</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="请输入新密码"
                            type={showNewPassword ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute top-0 right-0 h-full px-3 flex items-center"
                          onClick={() => toggleShowPassword('new')}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>确认新密码</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="请再次输入新密码"
                            type={showConfirmPassword ? "text" : "password"}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute top-0 right-0 h-full px-3 flex items-center"
                          onClick={() => toggleShowPassword('confirm')}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
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
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    "确认修改"
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