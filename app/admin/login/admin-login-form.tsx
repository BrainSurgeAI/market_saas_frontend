"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";


interface AdminLoginFormProps extends React.ComponentPropsWithoutRef<"div"> {}

const formSchema = z.object({
    username: z.string()
        .min(6, "用户名至少6个字符")
        .max(32, "用户名最多32个字符")
        .regex(/^[a-zA-Z0-9]+$/, "用户名只能包含字母和数字"),
    password: z.string()
        .min(8, "密码至少8个字符")
        .max(16, "密码最多16个字符")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?!.*\s)[a-zA-Z0-9!@#$%^&*(),.?":{}|<>]{8,}$/,
            "密码必须包含至少一个大小写字母和一个特殊字符，且不能包含空格"
        ),
    phone: z.string()
        .min(11, "请输入正确的手机号")
        .max(11, "请输入正确的手机号")
        .regex(/^1[3-9]\d{9}$/, "请输入正确的手机号格式"),
    verificationCode: z.string()
        .min(6, "验证码为6位数字")
        .max(6, "验证码为6位数字")
        .regex(/^\d{6}$/, "验证码必须是6位数字"),
});

export function AdminLoginForm({className, ...props}: AdminLoginFormProps) {
    const router = useRouter();
   
    const [loading, setLoading] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
            phone: "",
            verificationCode: "",
        },
    });

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const sendVerificationCode = async () => {
        // const phone = form.getValues("phone");
        // const phoneResult = z.string()
        //     .min(11, "请输入正确的手机号")
        //     .max(11, "请输入正确的手机号")
        //     .regex(/^1[3-9]\d{9}$/, "请输入正确的手机号格式")
        //     .safeParse(phone);

        // if (!phoneResult.success) {
        //     form.setError("phone", { message: "请输入正确的手机号" });
        //     return;
        // }

        // try {
        //     setSendingCode(true);
        //     // 替换为实际的发送验证码API
        //     await apiClient.sendAdminVerificationCode(phone);
        //     toast({
        //         title: "验证码已发送",
        //         description: "验证码已发送到您的手机，请注意查收",
        //     });
        //     setCountdown(60); // 60秒倒计时
        // } catch (err: any) {
        //     handleApiError(err as ApiError, toast);
        // } finally {
        //     setSendingCode(false);
        // }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true);
            // 替换为实际的管理员登录API
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: values.username,
                    password: values.password,
                    phone: values.phone,
                    verificationCode: values.verificationCode
                }),
            });
            
            const data = await res.json();
            
            if (res.ok && data.data) {  
                toast({
                    variant: 'default',
                    title: '登录成功',
                    description: '超级管理员登录成功，正在跳转...',
                })
                router.push('/admin/dashboard');
                return;
            } else {
                toast({
                    variant: 'destructive',
                    title: '登录失败',
                    description: data.message || '用户名或密码错误',
                });
            }
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: '登录失败',
                description: err?.message || '服务器错误，请稍后再试',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">超级管理员登录</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    请输入您的管理员账号信息和手机验证码
                </p>
            </div>
            <div className="grid gap-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>用户名</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入管理员用户名" {...field} />
                                    </FormControl>
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
                                        <Input type="password" placeholder="请输入管理员密码" {...field} />
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
                                    <FormLabel>手机号</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入绑定的手机号" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="verificationCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>验证码</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input placeholder="请输入6位验证码" {...field} />
                                        </FormControl>
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={sendVerificationCode}
                                            disabled={countdown > 0 || sendingCode}
                                            className="whitespace-nowrap min-w-24"
                                        >
                                            {countdown > 0 
                                                ? `${countdown}秒后重试` 
                                                : sendingCode 
                                                    ? "发送中..." 
                                                    : "获取验证码"}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "登录中..." : "超级管理员登录"}
                        </Button>
                    </form>
                </Form>
            </div>
            <div className="text-center text-sm text-muted-foreground">
                此登录入口仅供系统管理员使用，普通用户请
                <Button
                    variant="link"
                    className="pl-1"
                    onClick={() => router.push('/login')}
                >
                    返回用户登录
                </Button>
            </div>
        </div>
    )
}