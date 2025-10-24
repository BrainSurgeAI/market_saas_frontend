'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Api, TestTube, Copy, Check } from 'lucide-react';

export default function ApiTestPage() {
    const { toast } = useToast();
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiResponse, setApiResponse] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const testUserMenuApi = async () => {
        if (!token) {
            toast({
                variant: "destructive",
                title: "请输入Token",
                description: "需要提供有效的认证token才能测试API"
            });
            return;
        }

        setIsLoading(true);
        setApiResponse(null);

        try {
            // 直接调用后端API
            const response = await fetch('http://localhost:3001/api/v1/menus', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                cache: 'no-store'
            });

            const result = await response.json();

            setApiResponse({
                status: response.status,
                ok: response.ok,
                data: result
            });

            if (response.ok && result.code === 200) {
                toast({
                    title: "API测试成功",
                    description: `成功获取菜单配置，角色: ${result.data?.data?.userRoles?.join(', ') || '未知'}`
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "API测试失败",
                    description: `状态码: ${response.status}, 错误: ${result.message || '未知错误'}`
                });
            }

        } catch (error) {
            setApiResponse({
                status: 'ERROR',
                ok: false,
                data: { error: error instanceof Error ? error.message : '网络错误' }
            });

            toast({
                variant: "destructive",
                title: "API请求失败",
                description: "无法连接到后端API服务器"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const testFrontendApi = async () => {
        if (!token) {
            toast({
                variant: "destructive",
                title: "请输入Token",
                description: "需要提供有效的认证token才能测试前端API"
            });
            return;
        }

        setIsLoading(true);
        setApiResponse(null);

        try {
            // 设置测试token
            document.cookie = `auth-token=${token}; path=/; max-age=86400`;

            // 调用前端API代理
            const response = await fetch('/api/user/menu', {
                method: 'GET',
                cache: 'no-store'
            });

            const result = await response.json();

            setApiResponse({
                status: response.status,
                ok: response.ok,
                data: result
            });

            if (response.ok && result.code === 200) {
                toast({
                    title: "前端API测试成功",
                    description: `成功获取菜单配置，角色: ${result.data?.userRoles?.join(', ') || '未知'}`
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "前端API测试失败",
                    description: `状态码: ${response.status}, 错误: ${result.message || '未知错误'}`
                });
            }

        } catch (error) {
            setApiResponse({
                status: 'ERROR',
                ok: false,
                data: { error: error instanceof Error ? error.message : '网络错误' }
            });

            toast({
                variant: "destructive",
                title: "前端API请求失败",
                description: "无法连接到前端API代理"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast({
                title: "已复制",
                description: "响应内容已复制到剪贴板"
            });
        });
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Api className="h-8 w-8" />
                <div>
                    <h1 className="text-3xl font-bold">API测试工具</h1>
                    <p className="text-muted-foreground mt-1">
                        测试后端菜单API和前端API代理
                    </p>
                </div>
            </div>

            {/* Token输入 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TestTube className="h-5 w-5" />
                        认证Token
                    </CardTitle>
                    <CardDescription>
                        输入你的JWT token来测试API
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="token">JWT Token</Label>
                        <Input
                            id="token"
                            type="password"
                            placeholder="输入你的JWT token..."
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={testUserMenuApi}
                            disabled={isLoading || !token}
                            className="flex-1"
                        >
                            <TestTube className="mr-2 h-4 w-4" />
                            {isLoading ? '测试中...' : '测试后端API'}
                        </Button>
                        <Button
                            onClick={testFrontendApi}
                            disabled={isLoading || !token}
                            variant="outline"
                            className="flex-1"
                        >
                            <Api className="mr-2 h-4 w-4" />
                            {isLoading ? '测试中...' : '测试前端API'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* API响应 */}
            {apiResponse && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>API响应</CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge variant={apiResponse.ok ? "default" : "destructive"}>
                                    状态码: {apiResponse.status}
                                </Badge>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(JSON.stringify(apiResponse.data, null, 2))}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(apiResponse.data, null, 2)}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 使用说明 */}
            <Card>
                <CardHeader>
                    <CardTitle>使用说明</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <h4 className="font-medium">测试步骤</h4>
                            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                <li>获取有效的JWT token</li>
                                <li>在上方输入框中输入token</li>
                                <li>点击"测试后端API"直接测试后端</li>
                                <li>点击"测试前端API"测试前端代理</li>
                                <li>查看响应结果验证数据格式</li>
                            </ol>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-medium">预期数据格式</h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>后端API应该返回:</p>
                                <code className="block bg-gray-100 p-2 rounded text-xs">
                                    {`{
  "code": 200,
  "data": {
    "data": {
      "userRoles": ["super_admin"],
      "primaryRole": "super_admin",
      "menuConfig": {...}
    }
  }
}`}
                                </code>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <h4 className="font-medium">故障排除</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>如果后端API失败，检查后端服务是否运行在 localhost:3001</li>
                            <li>如果前端API失败，检查token是否有效且未过期</li>
                            <li>确保环境变量 BACKEND_API_URL 设置正确</li>
                            <li>查看浏览器控制台获取详细错误信息</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}