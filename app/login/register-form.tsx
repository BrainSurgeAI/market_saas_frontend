"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast";
import { ApiError, handleApiError } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { register } from "./actions";

const formSchema = z.object({
    tenantName: z.string()
        .min(2, "组织名称至少2个字符")
        .max(64, "组织名称最多64个字符"),
    username: z.string()
        .min(6, "用户名至少6个字符")
        .max(32, "用户名最多32个字符")
        .regex(/^[a-zA-Z0-9]{6,32}$/, "用户名必须是6-32位的字母或数字"),
    tenantType: z.enum(["MARKET", "PROVIDER", "CUSTOMER"], {
        required_error: "请选择组织类型",
    }),
    password: z.string()
    .min(8, "密码至少8个字符")
    .max(16, "密码最多16个字符")
    .refine(
        (password) => !password.includes(' '),
        "密码不能包含空格"
    )
    .refine(
        (password) => /[A-Z]/.test(password),
        "密码必须包含大写字母"
    )
    .refine(
        (password) => /[a-z]/.test(password),
        "密码必须包含小写字母"
    )
    .refine(
        (password) => /[0-9]/.test(password),
        "密码必须包含数字"
    )
    .refine(
        (password) => /[!@#$%^&*()_+\-=\[\]{}\\|;:'",.<>/?]/.test(password),
        "密码必须包含特殊字符(!@#$%^&*()_+-=[]{}\\|;:'\",.<>/?)"
    ),
    confirmPassword: z.string()
        .min(8, "密码至少8个字符")
        .max(16, "密码最多16个字符"),
    acceptTerms: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
}).refine((data) => data.acceptTerms === true, {
    message: "请阅读并同意用户协议",
    path: ["acceptTerms"],
});

interface RegisterFormProps {
    onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tenantName: "",
            username: "",
            tenantType: undefined,
            password: "",
            confirmPassword: "",
            acceptTerms: false,
        },
    });

    const handleAcceptTerms = () => {
        form.setValue('acceptTerms', true);
        setShowTerms(false);
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true);
            const res = await register(values);
            if (res.success) {
                //setToken(res.data || "");
                router.push('/workspace');
            } else {
                handleApiError(
                    { status: res.status || 500, message: res.error || "未知错误" }, 
                    toast
                );
            }
        } catch (err) {
            handleApiError(err as ApiError, toast);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h2 className="text-xl font-bold">账户注册</h2>
            <p className="text-sm text-muted-foreground mb-8">以下信息将用于组织认证，请确保信息真实性</p>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="tenantName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>组织名称 * (请与营业执照一致)</FormLabel>
                                <FormControl>
                                    <Input className="text-sm" placeholder="请输入组织名称" {...field} />
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
                                <FormLabel>用户名 * </FormLabel>
                                <FormControl>
                                    <Input className="text-sm" placeholder="请输入用户名" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="tenantType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>组织类型 * </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue className="text-sm" placeholder="我是" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem className="text-sm" value="MARKET">市场</SelectItem>
                                        <SelectItem className="text-sm" value="PROVIDER">供应商</SelectItem>
                                        <SelectItem className="text-sm" value="CUSTOMER">客户</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>密码</FormLabel>
                                <FormControl>
                                    <Input type="password" className="text-sm" placeholder="请输入密码" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>确认密码</FormLabel>
                                <FormControl>
                                    <Input type="password" className="text-sm" placeholder="请再次输入密码" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="acceptTerms"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="flex items-center">
                                    <FormLabel className="text-sm font-normal">
                                        我已阅读并同意
                                        <Button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowTerms(true);
                                            }}
                                            variant="link"
                                            className="px-1 text-sm h-auto p-0"
                                            type="button"
                                        >
                                            《用户协议》
                                        </Button>
                                    </FormLabel>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "注册中..." : "注册"}
                    </Button>
                    <Dialog open={showTerms} onOpenChange={setShowTerms}>
                        <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>用户协议</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                    {`在此处放入您的用户协议全文...

1. 服务条款
...

2. 用户责任
...

3. 隐私政策
...

4. 其他条款
...`}
                                </p>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowTerms(false)}>
                                    取消
                                </Button>
                                <Button onClick={handleAcceptTerms}>
                                    接受
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </form>
            </Form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
                已有账户？
                <Button variant="link" className="pl-1 text-sm" onClick={onSwitchToLogin}>
                    立即登录
                </Button>
            </div>
        </>
    );
}