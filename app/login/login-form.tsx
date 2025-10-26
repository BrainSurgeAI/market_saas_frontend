"use client"

import { useState } from 'react';
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
import { cacheMenuAfterLogin } from "@/lib/menuCache";
import { jwtDecode } from 'jwt-decode';
import { TokenPayload } from '@/app/models';


const formSchema = z.object({
    username: z.string()
        .min(4, "用户名至少4个字符")
        .max(32, "用户名最多32个字符")
        .regex(/^[a-zA-Z0-9]+$/, "用户名只能包含字母和数字"),
    password: z.string()
        .min(8, "密码至少8个字符")
        .max(16, "密码最多16个字符")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])(?!.*\s)[a-zA-Z0-9!@#$%^&*(),.?":{}|<>]{8,}$/,
            "密码必须包含至少一个大小写字母和一个特殊字符，且不能包含空格"
        ),
});

export function LoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    async function handleFormSubmit(username: string, password: string) {
        try {
            setLoading(true);
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                toast({
                    title: "登录失败",
                    description: `${data.error}`,
                    variant: "destructive",
                    duration: 2000,
                });
                return;
            }

            const loginData = await response.json();

            // 解析用户信息
            let userRoles: string[] = [];
            let primaryRole: string = '';

            try {
                const decoded = jwtDecode<TokenPayload>(loginData.data);
                userRoles = decoded.roles || [];
                primaryRole = userRoles[0] || ''; // 使用第一个角色作为主角色

                // 存储用户角色到 localStorage
                localStorage.setItem('user-roles', JSON.stringify(userRoles));
                console.log('用户角色已存储到 localStorage:', userRoles);

            } catch (error) {
                console.error('解析用户信息失败:', error);
            }

            // 在后台缓存菜单数据
            if (primaryRole && userRoles.length > 0) {
                cacheMenuAfterLogin(
                    primaryRole,
                    userRoles,
                    async () => {
                        // 获取菜单数据的函数
                        const menuResponse = await fetch('/api/user/menu', {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });

                        if (!menuResponse.ok) {
                            throw new Error('Failed to fetch menu');
                        }

                        const menuResult = await menuResponse.json();
                        if (menuResult.code === 200 && menuResult.data) {
                            return menuResult.data;
                        }
                        return null;
                    }
                ).catch(error => {
                    console.error('缓存菜单失败:', error);
                    // 不影响登录流程，继续跳转
                });
            }

            toast({
                title: "登录成功",
                description: "正在跳转到工作区...",
                variant: "success",
                duration: 2000,
            });

            router.push('/workspace');
        } catch (error) {
            toast({
                title: "登录失败",
                description: error instanceof Error ? error.message : "请稍后再试",
                variant: "destructive",
                duration: 2000,
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={cn("flex flex-col gap-6")} >
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">登录您的账户</h1>
            </div>
            <div className="grid gap-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => handleFormSubmit(data.username, data.password))} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>用户名</FormLabel>
                                    <FormControl>
                                        <Input placeholder="请输入用户名" {...field} />
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
                                        <Input type="password" placeholder="请输入密码" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "登录中..." : "登录"}
                        </Button>
                    </form>
                </Form>

                {/* <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
        <Button variant="outline" className="w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              fill="currentColor"
            />
          </svg>
          Login with GitHub
        </Button> */}
            </div>
            {/* <div className="text-center text-sm">
                您还未有账户?{" "}
                <Button
                    variant="link"
                    className="pl-1"
                    onClick={onSwitchToRegister}
                >
                    立即注册
                </Button>
            </div> */}
        </div>
    )
}
