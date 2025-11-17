"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useOrderDetails } from "@/app/workspace/hooks/useOrderDetails";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { OperationType, OrderItem, ReturnExchangeItem, TenantType, ExchangeItemStatus } from "@/lib/types/orderStatus";
import { Loader2, ArrowLeft } from "lucide-react";
import { ExchangeItemsTable } from "./ExchangeItemsTable";

interface ExchangeOrderPageProps {
  orderCode: string;
  orgId: string;
  tenantType: string;
}

type ExchangeFormState = Record<number, {
  exchangeQuantity: string;
  remark: string;
}>;

type ExchangeRow = {
  item: OrderItem;
  requestedQuantity: number;
  records: ReturnExchangeItem[];
};

export function ExchangeOrderPage({ orderCode, orgId, tenantType }: ExchangeOrderPageProps) {
  const router = useRouter();
  const { user } = useWorkspace();
  const { toast } = useToast();

  const {
    orderDetail,
    orderItems,
    returnExchangeRecords,
    loading,
    error,
  } = useOrderDetails(orderCode, orgId, tenantType);

  const [formState, setFormState] = useState<ExchangeFormState>({});
  const [submitting, setSubmitting] = useState(false);

  const exchangeRows: ExchangeRow[] = useMemo(() => {
    if (!orderItems.length) return [];

    return orderItems
      .map((item) => {
        const records = returnExchangeRecords.filter(
          (record) => record.productId === item.productId && record.operationType === OperationType.EXCHANGE
        );

        if (!records.length && item.status !== "EXCHANGED") {
          return null;
        }

        const requestedQuantity = records.reduce((sum, record) => sum + Number(record.quantity || 0), 0);

        return {
          item,
          requestedQuantity,
          records,
        } satisfies ExchangeRow;
      })
      .filter((row): row is ExchangeRow => Boolean(row));
  }, [orderItems, returnExchangeRecords]);

  useEffect(() => {
    if (!exchangeRows.length) return;
    setFormState((prev) => {
      const next: ExchangeFormState = { ...prev };
      for (const row of exchangeRows) {
        if (!next[row.item.id]) {
          next[row.item.id] = {
            exchangeQuantity: row.requestedQuantity ? row.requestedQuantity.toString() : "0",
            remark: "",
          };
        }
      }
      return next;
    });
  }, [exchangeRows]);

  const handleQuantityChange = (id: number, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [id]: {
        exchangeQuantity: value,
        remark: prev[id]?.remark ?? "",
      },
    }));
  };

  const handleRemarkChange = (id: number, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [id]: {
        exchangeQuantity: prev[id]?.exchangeQuantity ?? "0",
        remark: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!orderDetail) return;

    const payloadItems = exchangeRows.map(({ item, requestedQuantity }) => ({
      id: item.id,
      productId: item.productId,
      requestedQuantity: requestedQuantity.toFixed(2),
      actualQuantity: formState[item.id]?.exchangeQuantity ?? "0",
      remark: formState[item.id]?.remark ?? "",
    }));

    setSubmitting(true);
    try {
      const response = await fetch(`/api/orders/${orderCode}/exchange-deliver`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operateBy: user?.name || '',
          items: payloadItems,
        }),
      });

      if (!response.ok) {
        throw new Error(`提交换货信息失败: ${response.status}`);
      }

      toast({
        title: '提交成功',
        description: '换货信息已提交，请等待市场验收',
        variant: 'success',
      });
      router.back();
    } catch (err) {
      toast({
        title: '提交失败',
        description: err instanceof Error ? err.message : '提交换货信息时发生错误',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (tenantType.toLowerCase() !== TenantType.PROVIDER) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>权限不足</AlertTitle>
          <AlertDescription>仅供应商可以处理换货请求。</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">正在加载换货信息...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!exchangeRows.length) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>换货商品</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> 返回订单详情
            </Button>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTitle>暂无换货商品</AlertTitle>
              <AlertDescription>当前订单没有需要换货的商品。</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 检查是否使用ExchangeItemsTable组件的条件
  const shouldUseExchangeItemsTable = tenantType.toLowerCase() === TenantType.PROVIDER &&
    orderDetail?.orderStatus === 'EXCHANGE_IN_PROGRESS';

  if (shouldUseExchangeItemsTable) {
    // 转换数据格式为ExchangeItem[]
    const exchangeItems = exchangeRows.map(({ item, requestedQuantity, records }) => ({
      id: item.id,
      returnExchangeId: records[0]?.id || item.id,
      productCode: item.productId,
      productName: item.name,
      quantity: requestedQuantity,
      price: parseFloat(item.unitPrice),
      totalAmount: requestedQuantity * parseFloat(item.unitPrice),
      status: 'PENDING' as const, // 这里需要根据实际状态映射
      shippedAt: null,
      receivedAt: null,
      createdAt: orderDetail?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const handleStatusChange = async (itemId: number, newStatus: ExchangeItemStatus, reason?: string) => {
      // 这里需要实现状态变更API调用
      try {
        const response = await fetch(`/api/orders/${orderCode}/exchange-items/${itemId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            reason: reason || '',
            operateBy: user?.name || '',
          }),
        });

        if (!response.ok) {
          throw new Error(`状态更新失败: ${response.status}`);
        }

        toast({
          title: '操作成功',
          description: '换货商品状态已更新',
          variant: 'success',
        });

        // 刷新数据
        window.location.reload();
      } catch (err) {
        toast({
          title: '操作失败',
          description: err instanceof Error ? err.message : '状态更新时发生错误',
          variant: 'destructive',
        });
      }
    };

    const canPerformAction = (item: ExchangeItem, action: string) => {
      // PROVIDER用户在EXCHANGE_IN_PROGRESS状态下可以进行发货操作
      if (tenantType.toLowerCase() === TenantType.PROVIDER && action === 'ship') {
        return item.status === ExchangeItemStatus.PENDING;
      }
      return false;
    };

    const getStatusLabel = (status: ExchangeItemStatus) => {
      const labels: Record<ExchangeItemStatus, string> = {
        [ExchangeItemStatus.PENDING]: '待发货',
        [ExchangeItemStatus.SHIPPED]: '已发货',
        [ExchangeItemStatus.RECEIVED]: '已收货',
        [ExchangeItemStatus.REJECTED]: '已拒收',
        [ExchangeItemStatus.COMPLETED]: '已完成',
      };
      return labels[status] || status;
    };

    const getStatusVariant = (status: ExchangeItemStatus) => {
      const variants: Record<ExchangeItemStatus, "default" | "secondary" | "destructive" | "outline"> = {
        [ExchangeItemStatus.PENDING]: 'outline',
        [ExchangeItemStatus.SHIPPED]: 'secondary',
        [ExchangeItemStatus.RECEIVED]: 'default',
        [ExchangeItemStatus.REJECTED]: 'destructive',
        [ExchangeItemStatus.COMPLETED]: 'default',
      };
      return variants[status] || 'default';
    };

    return (
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">换货商品管理</h1>
            <p className="text-sm text-muted-foreground mt-1">
              订单编号：{orderDetail?.orderCode}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回订单详情
          </Button>
        </div>

        <ExchangeItemsTable
          items={exchangeItems}
          loading={loading}
          tenantType={tenantType}
          onStatusChange={handleStatusChange}
          canPerformAction={canPerformAction}
          getStatusLabel={getStatusLabel}
          getStatusVariant={getStatusVariant}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">订单换货处理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            订单编号：{orderDetail?.orderCode}，请根据申请换货量记录实际换货数量。
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回订单详情
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>换货商品列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品信息</TableHead>
                  <TableHead className="text-right">申请换货量</TableHead>
                  <TableHead className="text-right">本次换货量</TableHead>
                  <TableHead>换货备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exchangeRows.map(({ item, requestedQuantity }) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category} · 单位：{item.unit}</p>
                        <p className="text-xs text-muted-foreground">原申请：{requestedQuantity.toFixed(2)} {item.unit}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {requestedQuantity.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={formState[item.id]?.exchangeQuantity ?? "0"}
                        onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                        className="max-w-[140px] ml-auto text-right"
                        step="0.01"
                        min="0"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        placeholder="换货备注（可选）"
                        value={formState[item.id]?.remark ?? ""}
                        onChange={(event) => handleRemarkChange(item.id, event.target.value)}
                        className="min-h-[60px]"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "提交中..." : "提交换货"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
