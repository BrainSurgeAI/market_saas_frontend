import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { TenantType, OrderStatus, OrderItem, ReturnExchangeItem, OrderInspection, Delivery, Receipt } from "@/lib/types/orderStatus";
import type { ActionDescriptor } from "./types";
import { getInspectedQuantity, areAllItemsInspected } from "./roundGrouping";

export function createSettlementSummary({
  originalTotal,
  discountTotal,
  returnMoney,
  actualTotal,
}: {
  originalTotal: string;
  discountTotal: string;
  returnMoney: string;
  actualTotal: string;
}): ReactNode {
  const formatMoney = (value: string) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
  };

  const netTotal = parseFloat(actualTotal) - parseFloat(returnMoney);

  return (
    <>
      <Separator />
      <div className="mt-4 space-y-1 text-sm text-muted-foreground">
        <p>
          原价: <span className="font-semibold font-mono ml-2">¥{formatMoney(originalTotal)}</span>
        </p>
        <p className="text-red-600">
          折扣: <span className="font-semibold font-mono ml-2">-¥{formatMoney(discountTotal)}</span>
        </p>
        <p className="text-red-600">
          退款: <span className="font-semibold font-mono ml-2">-¥{formatMoney(returnMoney)}</span>
        </p>
        <p>
          实收: <span className="font-semibold font-mono ml-2">¥{Number.isFinite(netTotal) ? netTotal.toFixed(2) : "0.00"}</span>
        </p>
      </div>
      <Separator />
    </>
  );
}

export function buildCompletionAction({
  tenant,
  status,
  returnExchangeRecords,
  orderItems,
  completeAcceptance,
  showRejectConfirmation,
  productStatusSummary,
  requestCustomerExchange,
  requestingCustomerExchange,
  inspectionProgress,
  inspections,
  deliveries,
  receipts,
  orderCode,
}: {
  tenant: TenantType;
  status: OrderStatus;
  returnExchangeRecords: ReturnExchangeItem[];
  orderItems: OrderItem[];
  completeAcceptance: () => void;
  showRejectConfirmation: () => void;
  productStatusSummary: { totalItems: number; hasExchange: boolean; allInspected: boolean };
  requestCustomerExchange: () => void;
  requestingCustomerExchange: boolean;
  inspectionProgress: {
    marketCompleted: boolean;
    customerCompleted: boolean;
  };
  inspections?: OrderInspection[];
  deliveries?: Delivery[];
  receipts?: Receipt[];
  orderCode?: string;
}): ActionDescriptor | null {
  const requireAllProcessedStatuses = new Set<OrderStatus>([
    OrderStatus.MARKET_INSPECTING,
    OrderStatus.EXCHANGE_INSPECTING,
    OrderStatus.CUSTOMER_INSPECTING,
  ]);

  const marketInspectionStatuses = new Set<OrderStatus>([OrderStatus.MARKET_INSPECTING, OrderStatus.EXCHANGE_INSPECTING]);
  const customerInspectionStatuses = new Set<OrderStatus>([OrderStatus.CUSTOMER_INSPECTING]);

  const requireAllProcessed = requireAllProcessedStatuses.has(status);
  let allProcessed = true;

  if (tenant === TenantType.MARKET && marketInspectionStatuses.has(status)) {
    // MARKET 租户：检查是否所有商品都已验收
    if (deliveries && orderCode && inspections && receipts) {
      allProcessed = areAllItemsInspected('MARKET', inspections, deliveries, receipts, orderItems, orderCode);
    } else if (inspectionProgress.marketCompleted) {
      allProcessed = true;
    } else {
      // 检查是否有商品已签收（基于 inspections 数据）
      if (inspections && inspections.length > 0) {
        const hasInspectedItems = orderItems.some(item => {
          const qty = parseFloat(getInspectedQuantity(item.id, 'MARKET', inspections));
          return qty > 0;
        });
        allProcessed = productStatusSummary.allInspected || hasInspectedItems;
      } else {
        allProcessed = productStatusSummary.allInspected;
      }
    }
  } else if (tenant === TenantType.CUSTOMER && customerInspectionStatuses.has(status)) {
    // CUSTOMER 租户：检查是否所有商品都已验收
    if (deliveries && orderCode && inspections && receipts) {
      allProcessed = areAllItemsInspected('CUSTOMER', inspections, deliveries, receipts, orderItems, orderCode);
    } else {
      // 如果没有 deliveries 或 orderCode，回退到原来的逻辑
      if (inspections && inspections.length > 0) {
        const hasInspectedItems = orderItems.some(item => {
          const qty = parseFloat(getInspectedQuantity(item.id, 'CUSTOMER', inspections));
          return qty > 0;
        });
        if (hasInspectedItems) {
          allProcessed = productStatusSummary.allInspected;
        } else {
          allProcessed = inspectionProgress.customerCompleted;
        }
      } else {
        allProcessed = inspectionProgress.customerCompleted;
      }
    }
  } else if (requireAllProcessed) {
    const processedCountMatch =
      orderItems.length > 0 && returnExchangeRecords.length > 0 && returnExchangeRecords.length === orderItems.length;
    allProcessed = processedCountMatch;
  }

  if (!allProcessed) {
    return null;
  }

  if (tenant === TenantType.MARKET && (status === OrderStatus.MARKET_INSPECTING || status === OrderStatus.EXCHANGE_INSPECTING)) {
    if (productStatusSummary.hasExchange) {
      return {
        key: "market-request-exchange",
        type: "dialog",
        label: requestingCustomerExchange ? "提交中..." : "申请换货",
        className: "h-8 px-3 text-xs bg-orange-600 text-white hover:bg-orange-500",
        dialog: {
          title: "确认申请换货?",
          description: "确认后，系统将通知供应商处理换货申请。",
        },
        onConfirm: requestCustomerExchange,
        disabled: requestingCustomerExchange,
        loading: requestingCustomerExchange,
      };
    }

    return {
      key: "market-complete-acceptance",
      type: "button",
      label: "完成验收",
      className: "h-8 px-2 text-xs bg-green-700 text-white hover:bg-green-600",
      onClick: completeAcceptance,
    };
  }

  if (tenant === TenantType.CUSTOMER) {
    if (status === OrderStatus.CUSTOMER_INSPECTING) {
      if (productStatusSummary.hasExchange) {
        return {
          key: "customer-request-exchange",
          type: "dialog",
          label: requestingCustomerExchange ? "提交中..." : "申请换货",
          className: "h-8 px-3 text-xs bg-orange-600 text-white hover:bg-orange-500",
          dialog: {
            title: "确认申请换货?",
            description: "确认后，系统将通知市场处理换货申请。",
          },
          onConfirm: requestCustomerExchange,
          disabled: requestingCustomerExchange,
          loading: requestingCustomerExchange,
        };
      }

      if (productStatusSummary.allInspected && !productStatusSummary.hasExchange) {
        return {
          key: "customer-complete-acceptance",
          type: "dialog",
          label: "完成验收",
          className: "h-8 px-3 text-xs bg-green-700 text-white hover:bg-green-600",
          dialog: {
            title: "确认完成验收?",
            description: "确认后，订单状态将更新为\"已完成\"。",
          },
          onConfirm: completeAcceptance,
        };
      }
    }

    if (status === OrderStatus.RETURN_REQUESTED) {
      return {
        key: "customer-reject-after-sale",
        type: "button",
        label: "拒绝供应商售后",
        className: "h-8 px-2 text-xs bg-red-700 text-white hover:bg-red-600",
        onClick: showRejectConfirmation,
      };
    }
  }

  return null;
}

