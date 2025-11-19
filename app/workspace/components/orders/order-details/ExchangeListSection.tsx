import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OrderStatus, TenantType, OperationType, ExchangeItemStatus } from "@/lib/types/orderStatus";
import { ExchangeItemsTable } from "../ExchangeItemsTable";
import type { ExchangeItem } from "@/lib/types/orderStatus";

interface ExchangeListSectionProps {
  tenantType: string;
  orderStatus: OrderStatus;
  beginInspecting: boolean;
  onBeginInspect: () => void;
  allExchangeItemsCompleted: boolean;
  onDeliverToMarket: () => void;
  exchangeItems: ExchangeItem[];
  loadingExchangeReturn: boolean;
  handleExchangeStatusChange: (itemId: number, newStatus: ExchangeItemStatus, reason?: string) => Promise<void>;
  handleOperation: (itemId: number, operationType: OperationType) => void;
  canPerformExchangeAction: (item: ExchangeItem, action: string) => boolean;
  getExchangeStatusLabel: (status: ExchangeItemStatus) => string;
  getExchangeStatusVariant: (status: ExchangeItemStatus) => "default" | "secondary" | "destructive" | "outline";
  onCompleteAcceptance?: () => void;
  getReceivedQuantity?: (itemId: number) => string | number | undefined;
  updateLocalActualQuantity?: (itemId: number, actualQuantity: number) => void;
}

export function ExchangeListSection({
  tenantType,
  orderStatus,
  beginInspecting,
  onBeginInspect,
  allExchangeItemsCompleted,
  onDeliverToMarket,
  exchangeItems,
  loadingExchangeReturn,
  handleExchangeStatusChange,
  handleOperation,
  canPerformExchangeAction,
  getExchangeStatusLabel,
  getExchangeStatusVariant,
  onCompleteAcceptance,
  getReceivedQuantity,
  updateLocalActualQuantity,
}: ExchangeListSectionProps) {
  const tenantLower = tenantType.toLowerCase();

  // 判断所有换货商品是否都已完成验收（都有 actualQuantity）
  const allExchangeItemsInspected = exchangeItems.length > 0 && 
    exchangeItems.every(item => item.actualQuantity && parseFloat(item.actualQuantity.toString()) > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {tenantLower === TenantType.MARKET &&
            orderStatus === OrderStatus.EXCHANGE_DELIVERING &&
            renderBeginInspectButton(beginInspecting, onBeginInspect)}
          {allExchangeItemsCompleted && tenantLower === TenantType.PROVIDER && (
            <Button onClick={onDeliverToMarket} className="bg-green-600 hover:bg-green-500 text-white" size="sm">
              确定交付到市场
            </Button>
          )}
          {tenantLower === TenantType.MARKET &&
            orderStatus === OrderStatus.EXCHANGE_INSPECTING &&
            allExchangeItemsInspected &&
            onCompleteAcceptance && (
              <Button onClick={onCompleteAcceptance} className="bg-green-700 hover:bg-green-600 text-white" size="sm">
                完成验收
              </Button>
            )}
        </div>
      </div>

      {allExchangeItemsCompleted && tenantLower === TenantType.PROVIDER && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">所有换货商品都已完成，可以点击上方按钮确认交付到市场。</p>
        </div>
      )}

      {exchangeItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">暂无换货记录</p>
        </div>
      ) : (
        <ExchangeItemsTable
          items={exchangeItems}
          loading={loadingExchangeReturn}
          tenantType={tenantType}
          orderStatus={orderStatus}
          onStatusChange={handleExchangeStatusChange}
          onOperation={(itemId, operationType) => handleOperation(itemId, operationType as OperationType)}
          canPerformAction={canPerformExchangeAction}
          getStatusLabel={getExchangeStatusLabel}
          getStatusVariant={getExchangeStatusVariant}
          getReceivedQuantity={getReceivedQuantity}
        />
      )}
    </div>
  );
}

function renderBeginInspectButton(beginInspecting: boolean, onBeginInspect: () => void): ReactNode {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" disabled={beginInspecting}>
          {beginInspecting ? "处理中..." : "开始验收"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm font-semibold">确认开始验收?</AlertDialogTitle>
          <AlertDialogDescription className="text-xs">确认后，订单状态更新为"验收中"，表示您已开始验收该订单的商品。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-xs">取消</AlertDialogCancel>
          <AlertDialogAction onClick={onBeginInspect} className="bg-blue-600 hover:bg-blue-500 text-white text-xs" disabled={beginInspecting}>
            {beginInspecting ? "处理中..." : "确认"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

