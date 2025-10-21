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
import { User } from "@/app/models";

// 表单验证模式
const userEditFormSchema = z.object({
    name: z.string().min(2, "姓名至少需要2个字符").max(16, "姓名不能超过16个字符"),
    email: z.string().email("请输入有效的电子邮件地址"),
    phone: z
        .string()
        .regex(/^1[3-9]\d{9}$/, "请输入有效的手机号码")
});

type UserEditFormValues = z.infer<typeof userEditFormSchema>;

interface EditUserDialogProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    tenantId: string;
    tenantType: string;
    marketId: string;
    hasAdmin?: boolean;
    adminUserId?: string; // 当前管理员用户ID
}

export function EditUserDialog({
    isOpen,
    onClose,
    user,
    tenantId,
    tenantType,
    marketId,
    hasAdmin = false,
    adminUserId,
}: EditUserDialogProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    // 角色选项基于租户类型
    const roleOptions = tenantType === "PROVIDER"
        ? [
            { value: "PROVIDER_ADMIN", label: "供应商管理员", adminRole: true },
            { value: "PROVIDER", label: "用户", adminRole: false },
        ]
        : tenantType === "CUSTOMER"
            ? [
                { value: "CUSTOMER_ADMIN", label: "管理员", adminRole: true },
                { value: "ORDER_CREATOR", label: "采购员", adminRole: false },
            ]
            : [];

    // 过滤角色选项，如果已有管理员则排除管理员角色，除非正在编辑的就是管理员
    const filteredRoleOptions = (hasAdmin && user?.id !== adminUserId)
        ? roleOptions.filter(role => !role.adminRole)
        : roleOptions;

    // 表单默认值
    const defaultValues: Partial<UserEditFormValues> = {
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",

    };

    // 初始化表单
    const form = useForm<UserEditFormValues>({
        resolver: zodResolver(userEditFormSchema),
        defaultValues,
    });

    // 当用户对象变化时重置表单
    useEffect(() => {
        if (user) {
            form.reset({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",

            });
        }
    }, [user, form]);

    // 表单提交处理
    const onSubmit = async (data: UserEditFormValues) => {
        if (!user) return;

        setIsSubmitting(true);
        setSubmitStatus("idle");
        setErrorMessage("");

        try {
            const response = await fetch(`/api/markets/${marketId}/tenants/${tenantId}/users/${user.username}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                setSubmitStatus("error");
                setErrorMessage("更新用户失败");
                return;
            }

            const result = await response.json();

            if (!result.success) {
                setSubmitStatus("error");
                setErrorMessage(result.error || "更新用户失败");
                return;
            }

            setSubmitStatus("success");
            setTimeout(() => {
                onClose();
                router.refresh(); // 刷新页面数据
                toast({
                    title: "更新成功",
                    description: `用户 ${data.name} 信息已成功更新`,
                });
            }, 1500);

        } catch (error) {
            setSubmitStatus("error");
            setErrorMessage("发生网络错误，请稍后再试");
            console.error("更新用户出错:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>编辑用户</DialogTitle>
                    <DialogDescription>
                        修改用户信息，包括姓名、联系方式和角色。
                        {hasAdmin && user?.id !== adminUserId && (
                            <span className="mt-2 block text-xs text-amber-600">
                                注意：该租户已有管理员用户，不能将此用户设为管理员角色。
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {submitStatus === "success" ? (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        <div className="rounded-full bg-green-100 p-3">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-medium text-center">用户更新成功！</h3>
                        <p className="text-sm text-gray-500 text-center">
                            用户信息已成功更新并保存到系统。
                        </p>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {submitStatus === "error" && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>更新失败</AlertTitle>
                                    <AlertDescription>
                                        {errorMessage || "更新用户时发生错误，请检查输入并重试。"}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-1 gap-4">
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
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>电子邮箱</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="请输入邮箱地址" {...field} />
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
                                                    <Input placeholder="请输入手机号码" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
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