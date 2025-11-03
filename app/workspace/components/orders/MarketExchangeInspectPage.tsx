"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOrderDetails } from "@/app/workspace/hooks/useOrderDetails";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { OperationType, OrderItem, ReturnExchangeItem, TenantType } from "@/lib/types/orderStatus";

interface MarketExchangeInspectPageProps {
  orderCode: string;
  orgId: string;
  tenantType: string;
}

type InspectFormState = Record<number, {
  operationType: OperationType;
  quantity: string;
  reason: string;
}>;

export function MarketExchangeInspectPage({ orderCode, orgId, tenantType }: MarketExchangeInspectPageProps) {
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

  const [formState, setFormState] = useState<InspectFormState>({});
  const [submitting, setSubmitting] = useState(false);

  const exchangeRows = useMemo(() => {
    return orderItems
      .map((item) => {
        const exchangeRecords = returnExchangeRecords.filter(
          (record) => record.productId === item.productId && record.operationType === OperationType.EXCHANGE
        );

        if (!exchangeRecords.length && item.status !== "EXCHANGED") {
          return null;
        }

        const requestedQuantity = exchangeRecords.reduce((sum, record) => sum + Number(record.quantity || 0), 0);

        return {
          item,
          requestedQuantity,
          deliveredQuantity: Number(item.actualQuantity || 0),
        };
      })
      .filter(Boolean) as Array<{ item: OrderItem; requestedQuantity: number; deliveredQuantity: number }>;
  }, [orderItems, returnExchangeRecords]);

  if (tenantType.toLowerCase() !== TenantType.MARKET) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>权限不足</AlertTitle>
          <AlertDescription>仅市场用户可以验收换货商品。</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">正在加载换货商品...</span>
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
            <CardTitle>换货验收</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> 返回订单详情
            </Button>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTitle>暂无换货商品</AlertTitle>
              <AlertDescription>当前订单没有等待验收的换货商品。</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleOperationChange = (id: number, operation: OperationType) => {
    setFormState((prev) => ({
      ...prev,
      [id]: {
        operationType: operation,
        quantity: prev[id]?.quantity ?? "0",
        reason: prev[id]?.reason ?? "",
      },
    }));
  };

  const handleQuantityChange = (id: number, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [id]: {
        operationType: prev[id]?.operationType ?? OperationType.SIGN,
        quantity: value,
        reason: prev[id]?.reason ?? "",
      },
    }));
  };

  const handleReasonChange = (id: number, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [id]: {
        operationType: prev[id]?.operationType ?? OperationType.SIGN,
        quantity: prev[id]?.quantity ?? "0",
        reason: value,
      },
    }));
  };

  const validateForm = () => {
    for (const { item } of exchangeRows) {
      const state = formState[item.id];
      const quantity = Number(state?.quantity ?? 0);
      if (!state || Number.isNaN(quantity) || quantity <= 0) {
        toast({
          title: '提交失败',
          description: '请填写有效的验收数量。',
          variant: 'destructive',
        });
        return false;
      }
      if (state.operationType === OperationType.RETURN && !state.reason.trim()) {
        toast({
          title: '提交失败',
          description: '退货需填写原因。',
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!orderDetail) return;
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      for (const { item } of exchangeRows) {
        const state = formState[item.id];
        const response = await fetch(`/api/orders/${orderCode}/inspect-sub-orders`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operateBy: user?.name || '',
            receipt: {
              id: item.id,
              orderId: orderDetail.orderCode,
              productId: item.productId,
              productName: item.name,
              operationType: state.operationType,
              quantity: Number(state.quantity) || 0,
              reason: state.reason,
              unit: item.unit,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`提交商品 ${item.name} 验收信息失败: ${response.status}`);
        }
      }

      toast({
        title: '提交成功',
        description: '换货验收信息已提交。',
        variant: 'success',
      });
      router.back();
    } catch (error) {
      toast({
        title: '提交失败',
        description: error instanceof Error ? error.message : '提交验收信息时出错',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">换货验收</h1>
          <p className="text-sm text-muted-foreground mt-1">
            订单编号：{orderDetail?.orderCode}，请确认供应商换货商品并提交验收结果。
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
                  <TableHead className="text-right">供应商换货量</TableHead>
                  <TableHead className="text-right">验收数量</TableHead>
                  <TableHead>处理方式</TableHead>
                  <TableHead>说明</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exchangeRows.map(({ item, requestedQuantity, deliveredQuantity }) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category} · 单位：{item.unit}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {requestedQuantity.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {deliveredQuantity.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={formState[item.id]?.quantity ?? deliveredQuantity.toFixed(2)}
                        onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                        className="max-w-[140px] ml-auto text-right"
                        step="0.01"
                        min="0"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={formState[item.id]?.operationType ?? OperationType.SIGN}
                        onValueChange={(value: OperationType) => handleOperationChange(item.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择处理方式" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={OperationType.SIGN}>验收通过</SelectItem>
                          <SelectItem value={OperationType.RETURN}>继续退货</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Textarea
                        placeholder="验收说明（退货时必填）"
                        value={formState[item.id]?.reason ?? ""}
                        onChange={(event) => handleReasonChange(item.id, event.target.value)}
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
              {submitting ? "提交中..." : "提交验收"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
