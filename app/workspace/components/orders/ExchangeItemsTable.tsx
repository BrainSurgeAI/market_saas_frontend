"use client";

import { Fragment, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDownIcon, Loader2, AlertCircle, Package, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ExchangeItem } from "@/lib/types/orderStatus";
import { ExchangeItemStatus, TenantType } from "@/lib/types/orderStatus";

interface ExchangeItemsTableProps {
  items: ExchangeItem[];
  loading?: boolean;
  tenantType: string;
  orderStatus?: string;
  onStatusChange: (itemId: number, newStatus: ExchangeItemStatus, reason?: string) => Promise<void>;
  onUpdateActualQuantity?: (itemId: number, actualQuantity: number) => void;
  onOperation?: (itemId: number, operationType: 'SIGN' | 'RETURN' | 'EXCHANGE') => void;
  canPerformAction: (item: ExchangeItem, action: string) => boolean;
  getStatusLabel: (status: ExchangeItemStatus) => string;
  getStatusVariant: (status: ExchangeItemStatus) => "default" | "secondary" | "destructive" | "outline";
}

interface OperationDialogState {
  itemId: number | null;
  action: string | null;
  reason: string;
  isOpen: boolean;
  isSubmitting: boolean;
}

export function ExchangeItemsTable({
  items,
  loading = false,
  tenantType,
  orderStatus,
  onStatusChange,
  onUpdateActualQuantity,
  onOperation,
  canPerformAction,
  getStatusLabel,
  getStatusVariant,
}: ExchangeItemsTableProps) {
  const [operationDialog, setOperationDialog] = useState<OperationDialogState>({
    itemId: null,
    action: null,
    reason: "",
    isOpen: false,
    isSubmitting: false,
  });

  // 内联编辑状态
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingActualQuantity, setEditingActualQuantity] = useState<string>("");

  const getActionNextStatus = (action: string): ExchangeItemStatus | null => {
    const statusMap: Record<string, ExchangeItemStatus> = {
      ship: ExchangeItemStatus.SHIPPED,
      receive: ExchangeItemStatus.RECEIVED,
      reject: ExchangeItemStatus.REJECTED,
      complete: ExchangeItemStatus.COMPLETED,
      confirm: ExchangeItemStatus.COMPLETED,
    };
    return statusMap[action] || null;
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      ship: "确认发货",
      receive: "确认收货",
      reject: "拒收退回",
      complete: "完成处理",
      confirm: "确认完成",
    };
    return labels[action] || action;
  };

  const getActionDescription = (action: string, item: ExchangeItem): string => {
    const descriptions: Record<string, string> = {
      ship: `确认发货商品 "${item.productName}" (数量: ${item.quantity})`,
      receive: `确认收货商品 "${item.productName}" (数量: ${item.quantity})`,
      reject: `拒收商品 "${item.productName}"，请说明原因`,
      complete: `完成验收商品 "${item.productName}"`,
      confirm: `确认完成换货商品 "${item.productName}"`,
    };
    return descriptions[action] || "";
  };

  const handleActionClick = (itemId: number, action: string) => {
    // 如果正在编辑，先保存编辑的值
    if (editingItemId !== null) {
      handleSaveEditing(editingItemId);
    }

    setOperationDialog({
      itemId,
      action,
      reason: "",
      isOpen: true,
      isSubmitting: false,
    });
  };

  const handleConfirmAction = async () => {
    if (!operationDialog.itemId || !operationDialog.action) return;

    const nextStatus = getActionNextStatus(operationDialog.action);
    if (!nextStatus) return;

    setOperationDialog((prev) => ({ ...prev, isSubmitting: true }));

    try {
      await onStatusChange(
        operationDialog.itemId,
        nextStatus,
        operationDialog.reason || undefined
      );

      setOperationDialog({
        itemId: null,
        action: null,
        reason: "",
        isOpen: false,
        isSubmitting: false,
      });
    } catch (error) {
      console.error("Operation failed:", error);
      // Error handling is typically done in the parent component
    } finally {
      setOperationDialog((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // 内联编辑处理函数
  const handleStartEditing = (itemId: number, currentQuantity: number) => {
    setEditingItemId(itemId);
    setEditingActualQuantity(currentQuantity.toString());
  };

  const handleSaveEditing = async (itemId: number) => {
    const quantity = parseFloat(editingActualQuantity);
    if (isNaN(quantity) || quantity < 0) {
      return; // 无效输入，不保存
    }

    // 调用父组件的更新函数
    if (onUpdateActualQuantity) {
      onUpdateActualQuantity(itemId, quantity);
    }

    setEditingItemId(null);
    setEditingActualQuantity("");
  };

  const handleCancelEditing = () => {
    setEditingItemId(null);
    setEditingActualQuantity("");
  };

  const statusColorMap: Record<ExchangeItemStatus, string> = {
    [ExchangeItemStatus.PENDING]: "bg-gray-50",
    [ExchangeItemStatus.SHIPPED]: "bg-blue-50",
    [ExchangeItemStatus.RECEIVED]: "bg-green-50",
    [ExchangeItemStatus.REJECTED]: "bg-red-50",
    [ExchangeItemStatus.COMPLETED]: "bg-green-100",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">加载换货商品中...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">暂无换货商品信息</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 移动端卡片布局 */}
      <div className="block md:hidden space-y-3">
        {items.map((item) => (
          <Card key={item.id} className={`p-4 ${statusColorMap[item.status]}`}>
            <div className="space-y-3">
              {/* 商品信息 */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-900">{item.productName}</h3>
                      <p className="text-xs text-gray-500 mt-1">编号: {item.productCode}</p>
                    </div>
                  </div>
                </div>
                <Badge variant={getStatusVariant(item.status)} className="text-xs flex-shrink-0">
                  {item.status === ExchangeItemStatus.PENDING ? "待确认" : getStatusLabel(item.status)}
                </Badge>
              </div>

              {/* 数量信息 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-500">换货数量</div>
                  <div className="font-mono font-semibold mt-1 text-sm">{item.quantity}</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-500">实际换货量</div>
                  {editingItemId === item.id ? (
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        value={editingActualQuantity}
                        onChange={(e) => setEditingActualQuantity(e.target.value)}
                        className="h-7 text-xs flex-1"
                        step="0.01"
                        min="0"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => handleSaveEditing(item.id)}
                      >
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={handleCancelEditing}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={`font-mono font-semibold mt-1 text-sm ${
                        ((item.status === ExchangeItemStatus.PENDING && orderStatus === 'EXCHANGE_IN_PROGRESS') ||
                         (tenantType.toLowerCase() === TenantType.MARKET && orderStatus === 'EXCHANGE_INSPECTING'))
                          ? "cursor-pointer hover:text-blue-600" 
                          : ""
                      }`}
                      onClick={() => {
                        const canEdit = 
                          (item.status === ExchangeItemStatus.PENDING && orderStatus === 'EXCHANGE_IN_PROGRESS') ||
                          (tenantType.toLowerCase() === TenantType.MARKET && orderStatus === 'EXCHANGE_INSPECTING');
                        if (canEdit) {
                          handleStartEditing(item.id, item.actualQuantity || 0);
                        }
                      }}
                    >
                      {item.actualQuantity || 
                        ((item.status === ExchangeItemStatus.PENDING && orderStatus === 'EXCHANGE_IN_PROGRESS') ||
                         (tenantType.toLowerCase() === TenantType.MARKET && orderStatus === 'EXCHANGE_INSPECTING')
                          ? '点击编辑' 
                          : '-')}
                    </div>
                  )}
                </div>
              </div>

              {/* 价格信息 */}
              <div className="grid grid-cols-2 gap-2 border-t pt-2">
                <div>
                  <div className="text-xs text-gray-500">单价</div>
                  <div className="font-mono font-semibold mt-1 text-sm">¥{item.price.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">总金额</div>
                  <div className="font-mono font-semibold mt-1 text-sm text-blue-600">¥{item.totalAmount.toFixed(2)}</div>
                </div>
              </div>

              {/* 时间信息 */}
              {(item.shippedAt || item.receivedAt) && (
                <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
                  {item.shippedAt && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>发货: {format(new Date(item.shippedAt), "MM-dd HH:mm")}</span>
                    </div>
                  )}
                  {item.receivedAt && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>收货: {format(new Date(item.receivedAt), "MM-dd HH:mm")}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end border-t pt-2">
                {orderStatus === 'EXCHANGE_REQUESTED' ? (
                  <Badge variant="outline" className="rounded-full bg-gray-50 text-gray-500 border-gray-200 text-xs">
                    待确认
                  </Badge>
                ) : (tenantType.toLowerCase() === TenantType.MARKET && orderStatus === 'EXCHANGE_DELIVERING') ? (
                  <Badge variant="outline" className="rounded-full bg-gray-50 text-gray-500 border-gray-200 text-xs">
                    -
                  </Badge>
                ) : (
                  <ExchangeItemOperationMenu
                    item={item}
                    tenantType={tenantType}
                    orderStatus={orderStatus}
                    canPerformAction={canPerformAction}
                    onActionClick={handleActionClick}
                    onOperation={onOperation}
                    getActionLabel={getActionLabel}
                  />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 桌面端表格布局 */}
      <div className="hidden md:block overflow-x-auto">
        <div className="relative" style={{ maxHeight: "600px", overflowY: "auto", zIndex: 40 }}>
          <Table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "180px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "100px" }} />
              <col />
            </colgroup>
            <TableHeader
              style={{
                position: "sticky",
                top: 0,
                zIndex: 1000,
                backgroundColor: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              <TableRow className="text-xs font-semibold bg-black text-white">
                <TableHead className="text-left p-3 border-b">商品名称</TableHead>
                <TableHead className="text-center p-3 border-b">需换货</TableHead>
                <TableHead className="text-center p-3 border-b">发货量</TableHead>
                <TableHead className="text-right p-3 border-b">单价</TableHead>
                <TableHead className="text-right p-3 border-b">总金额</TableHead>
                <TableHead className="text-center p-3 border-b">状态</TableHead>
                <TableHead className="text-center p-3 border-b">发货时间</TableHead>
                <TableHead className="text-center p-3 border-b">收货时间</TableHead>
                <TableHead className="text-right p-3 border-b">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <Fragment key={item.id}>
                  <TableRow className={`text-xs text-gray-700 ${statusColorMap[item.status]}`}>
                    <TableCell className="p-3 border-b font-medium">
                      <div>
                        <p className="truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground mt-1">编号: {item.productCode}</p>
                      </div>
                    </TableCell>
                    <TableCell className="p-3 text-center border-b font-mono font-semibold">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="p-3 text-center border-b font-mono">
                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editingActualQuantity}
                            onChange={(e) => setEditingActualQuantity(e.target.value)}
                            className="w-20 h-7 text-xs"
                            step="0.01"
                            min="0"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => handleSaveEditing(item.id)}
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={handleCancelEditing}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <span
                          className={
                            (item.status === ExchangeItemStatus.PENDING && orderStatus === 'EXCHANGE_IN_PROGRESS') ||
                            (tenantType.toLowerCase() === TenantType.MARKET && orderStatus === 'EXCHANGE_INSPECTING')
                              ? "cursor-pointer hover:bg-gray-100 px-2 py-1 rounded" 
                              : ""
                          }
                          onClick={() => {
                            const canEdit = 
                              (item.status === ExchangeItemStatus.PENDING && orderStatus === 'EXCHANGE_IN_PROGRESS') ||
                              (tenantType.toLowerCase() === TenantType.MARKET && orderStatus === 'EXCHANGE_INSPECTING');
                            if (canEdit) {
                              handleStartEditing(item.id, item.actualQuantity || 0);
                            }
                          }}
                        >
                          {item.actualQuantity || 
                            ((item.status === ExchangeItemStatus.PENDING && orderStatus === 'EXCHANGE_IN_PROGRESS') ||
                             (tenantType.toLowerCase() === TenantType.MARKET && orderStatus === 'EXCHANGE_INSPECTING')
                              ? '点击编辑' 
                              : '-')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="p-3 text-right border-b font-mono">
                      ¥{item.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-3 text-right border-b font-mono font-semibold">
                      ¥{item.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-3 text-center border-b">
                      {item.status === ExchangeItemStatus.PENDING ? (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 text-xs">
                          待确认
                        </Badge>
                      ) : (
                        <Badge variant={getStatusVariant(item.status)} className="text-xs">
                          {getStatusLabel(item.status)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="p-3 text-center border-b text-xs">
                      {item.shippedAt ? format(new Date(item.shippedAt), "MM-dd HH:mm") : "-"}
                    </TableCell>
                    <TableCell className="p-3 text-center border-b text-xs">
                      {item.receivedAt ? format(new Date(item.receivedAt), "MM-dd HH:mm") : "-"}
                    </TableCell>
                    <TableCell className="p-3 text-right border-b">
                      {orderStatus === 'EXCHANGE_REQUESTED' ? (
                        <Badge variant="outline" className="rounded-full bg-gray-50 text-gray-500 border-gray-200 text-xs">
                          待确认
                        </Badge>
                      ) : (tenantType.toLowerCase() === TenantType.MARKET && orderStatus === 'EXCHANGE_DELIVERING') ? (
                        // MARKET用户在EXCHANGE_DELIVERING状态下不显示操作菜单，因为还没有开始验收
                        <Badge variant="outline" className="rounded-full bg-gray-50 text-gray-500 border-gray-200 text-xs">
                          -
                        </Badge>
                      ) : (
                        <ExchangeItemOperationMenu
                          item={item}
                          tenantType={tenantType}
                          orderStatus={orderStatus}
                          canPerformAction={canPerformAction}
                          onActionClick={handleActionClick}
                          onOperation={onOperation}
                          getActionLabel={getActionLabel}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 操作确认对话框 */}
      <AlertDialog open={operationDialog.isOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setOperationDialog((prev) => ({ ...prev, isOpen: false }));
        }
      }}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">
              {operationDialog.action
                ? getActionLabel(operationDialog.action)
                : "确认操作"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {operationDialog.itemId
                ? (() => {
                    const item = items.find((i) => i.id === operationDialog.itemId);
                    return item ? getActionDescription(operationDialog.action || "", item) : "";
                  })()
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {(operationDialog.action === "reject" || operationDialog.action === "complete") && (
            <div className="space-y-3 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-xs">
                  {operationDialog.action === "reject" ? "拒收原因" : "备注信息"}
                </Label>
                <Textarea
                  id="reason"
                  placeholder={
                    operationDialog.action === "reject"
                      ? "请说明拒收原因..."
                      : "补充处理说明..."
                  }
                  value={operationDialog.reason}
                  onChange={(e) =>
                    setOperationDialog((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  className="min-h-[80px] text-xs"
                />
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={operationDialog.isSubmitting}
              className="text-xs"
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={operationDialog.isSubmitting}
              className={cn(
                "text-xs",
                operationDialog.action === "reject" && "bg-red-600 hover:bg-red-500"
              )}
            >
              {operationDialog.isSubmitting && (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              )}
              {operationDialog.isSubmitting ? "处理中..." : "确认"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ExchangeItemOperationMenuProps {
  item: ExchangeItem;
  tenantType: string;
  orderStatus?: string;
  canPerformAction: (item: ExchangeItem, action: string) => boolean;
  onActionClick: (itemId: number, action: string) => void;
  onOperation?: (itemId: number, operationType: 'SIGN' | 'RETURN' | 'EXCHANGE') => void;
  getActionLabel: (action: string) => string;
}

function ExchangeItemOperationMenu({
  item,
  tenantType,
  orderStatus,
  canPerformAction,
  onActionClick,
  onOperation,
  getActionLabel,
}: ExchangeItemOperationMenuProps) {
  const tenant = tenantType.toLowerCase();

  // 获取当前角色可执行的操作
  const availableActions = useMemo(() => {
    const actions: Array<{ key: string; label: string; variant?: "destructive" }> = [];

    // MARKET用户在EXCHANGE_DELIVERING状态下不显示操作菜单，因为还没有开始验收
    if (tenant === TenantType.MARKET && orderStatus === 'EXCHANGE_DELIVERING') {
      return actions; // 返回空数组，不显示任何操作
    }

    // MARKET用户在EXCHANGE_INSPECTING状态下显示签收、退货、换货选项（和商品清单一样）
    if (tenant === TenantType.MARKET && orderStatus === 'EXCHANGE_INSPECTING') {
      actions.push({ key: "sign", label: "签收" });
      actions.push({ key: "return", label: "退货", variant: "destructive" });
      actions.push({ key: "exchange", label: "换货" });
      return actions;
    }

    if (tenant === TenantType.PROVIDER) {
      // PROVIDER在EXCHANGE_IN_PROGRESS状态下显示"确定"
      if (orderStatus === 'EXCHANGE_IN_PROGRESS' && item.status === 'PENDING') {
        actions.push({ key: "confirm", label: "确定" });
      } else if (canPerformAction(item, "ship")) {
        actions.push({ key: "ship", label: "发货" });
      }
    }

    // MARKET用户在EXCHANGE_DELIVERING状态下不显示操作菜单（已在前面提前返回）
    // 这里只处理其他状态下的MARKET用户操作
    if (tenant === TenantType.MARKET && orderStatus !== 'EXCHANGE_DELIVERING') {
      if (canPerformAction(item, "receive")) {
        actions.push({ key: "receive", label: "确认收货" });
      }
      if (canPerformAction(item, "reject")) {
        actions.push({
          key: "reject",
          label: "拒收",
          variant: "destructive",
        });
      }
      if (canPerformAction(item, "complete")) {
        actions.push({ key: "complete", label: "完成处理" });
      }
    }

    if (tenant === TenantType.CUSTOMER) {
      if (canPerformAction(item, "confirm")) {
        actions.push({ key: "confirm", label: "确认完成" });
      }
    }

    return actions;
  }, [tenant, orderStatus, item, canPerformAction]);

  if (availableActions.length === 0) {
    return (
      <Badge variant="outline" className="rounded-full bg-gray-50 text-gray-500 border-gray-200 text-xs">
        暂无操作
      </Badge>
    );
  }

  if (availableActions.length === 1) {
    const action = availableActions[0];
    const handleClick = () => {
      if (onOperation && (action.key === 'sign' || action.key === 'return' || action.key === 'exchange')) {
        onOperation(item.id, action.key.toUpperCase() as 'SIGN' | 'RETURN' | 'EXCHANGE');
      } else {
        onActionClick(item.id, action.key);
      }
    };
    return (
      <Button
        size="sm"
        variant={action.variant === "destructive" ? "destructive" : "outline"}
        className="h-7 px-2 text-xs"
        onClick={handleClick}
      >
        {action.label}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
          ...
          <ChevronDownIcon className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {availableActions.map((action) => {
          const handleClick = () => {
            if (onOperation && (action.key === 'sign' || action.key === 'return' || action.key === 'exchange')) {
              onOperation(item.id, action.key.toUpperCase() as 'SIGN' | 'RETURN' | 'EXCHANGE');
            } else {
              onActionClick(item.id, action.key);
            }
          };
          return (
            <DropdownMenuItem
              key={action.key}
              onClick={handleClick}
              className={cn(
                "text-xs cursor-pointer",
                action.variant === "destructive" && "text-red-600"
              )}
            >
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
