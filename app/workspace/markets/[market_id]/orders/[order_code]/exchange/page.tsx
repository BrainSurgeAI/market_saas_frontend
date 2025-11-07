"use client";

import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExchangeItemsTable } from "@/app/workspace/components/orders/ExchangeItemsTable";
import { useExchangeItems } from "@/app/workspace/hooks/useExchangeItems";
import type { ExchangeItemStatus } from "@/lib/types/orderStatus";

export default function MarketExchangePage() {
  const params = useParams();
  const router = useRouter();
  const { organization, user } = useWorkspace();
  const { toast } = useToast();

  const orderCode = params.order_code as string;
  const marketId = params.market_id as string;
  const tenantType = organization.tenantType;

  // 使用 Exchange Items Hook 获取换货商品数据
  const {
    exchangeItems,
    loading,
    error,
    updateExchangeItemStatus,
    canPerformAction,
    getStatusLabel,
    getStatusVariant,
    fetchExchangeItems,
  } = useExchangeItems({
    orderCode,
    tenantType,
    enabled: true,
    useMockData: true, // 🎭 使用模拟数据进行演示
  });

  // 处理状态变更
  const handleStatusChange = async (
    itemId: number,
    newStatus: ExchangeItemStatus,
    reason?: string
  ) => {
    try {
      await updateExchangeItemStatus(itemId, newStatus, reason);

      toast({
        title: "操作成功",
        description: `商品状态已更新为 ${getStatusLabel(newStatus)}`,
        variant: "success",
        duration: 3000,
      });

      // 可选：刷新数据
      // await fetchExchangeItems();
    } catch (err) {
      toast({
        title: "操作失败",
        description: err instanceof Error ? err.message : "更新换货商品状态时出错",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // 处理返回
  const handleGoBack = () => {
    router.back();
  };

  // 权限检查：只有市场用户可以访问此页面
  const isMarket = tenantType.toLowerCase() === 'market';
  
  if (!isMarket) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>权限不足</AlertTitle>
          <AlertDescription>
            仅市场用户可以访问换货验收页面。
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 页头 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">换货验收</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            订单编号: {orderCode}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回订单详情
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchExchangeItems()}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </Alert>
      )}

      {/* 换货商品表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">换货商品清单</CardTitle>
          <CardDescription>
            请核对供应商交付的换货商品，确认数量与质量后进行相应操作。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 提示信息 */}
          {!loading && !error && exchangeItems.length > 0 && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">验收提醒</p>
                <p className="mt-1">
                  请仔细核对每件商品的数量和质量。如需拒收，请在操作时说明原因。
                  验收完成后，商品状态将自动更新。
                </p>
              </div>
            </div>
          )}

          {/* 表格组件 */}
          <ExchangeItemsTable
            items={exchangeItems}
            loading={loading}
            tenantType={tenantType}
            onStatusChange={handleStatusChange}
            canPerformAction={canPerformAction}
            getStatusLabel={getStatusLabel}
            getStatusVariant={getStatusVariant}
          />

          {/* 空状态提示 */}
          {!loading && !error && exchangeItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">暂无换货商品</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                当前订单没有需要处理的换货商品。如有疑问，请联系供应商或检查订单状态。
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                className="mt-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回订单详情
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 统计信息 */}
      {!loading && !error && exchangeItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">统计信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">总商品数</p>
                <p className="text-2xl font-bold">{exchangeItems.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">待发货</p>
                <p className="text-2xl font-bold text-gray-600">
                  {exchangeItems.filter((item) => item.status === 'PENDING').length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">已发货</p>
                <p className="text-2xl font-bold text-blue-600">
                  {exchangeItems.filter((item) => item.status === 'SHIPPED').length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold text-green-600">
                  {exchangeItems.filter((item) => item.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
