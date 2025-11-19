import { Save } from "lucide-react";
import type { OrderStrategy, OrderStrategyContext } from "./OrderStrategy";
import type { ActionDescriptor } from "../types";
import type { OrderItem, OrderInspection } from "@/lib/types/orderStatus";
import { OrderStatus, TenantType } from "@/lib/types/orderStatus";
import { canShowStartProcessing, shouldEnterEditMode } from "@/lib/utils/orderStatusUtils";
import { createSettlementSummary } from "../helpers";
import { getInspectedQuantity } from "../roundGrouping";

export class ProviderOrderStrategy implements OrderStrategy {
  getActionDescriptors(context: OrderStrategyContext): ActionDescriptor[] {
    const {
      orderDetail,
      orderItems,
      isEditing,
      savingChanges,
      hasErrors,
      actualTotal,
      discountTotal,
      originalTotal,
      returnMoney,
      status,
      tenantType,
      startingExchange,
      processing,
      handleBeginExchangeProcessing,
      handleStartProcessing,
      handleSaveActualQuantities,
    } = context;

    const descriptors: ActionDescriptor[] = [];
    const hasBlockingErrors = hasErrors();

    if (status === OrderStatus.EXCHANGE_REQUESTED) {
      descriptors.push({
        key: "provider-exchange-progress",
        type: "button",
        label: startingExchange ? "处理中..." : "确定退换货",
        variant: "default",
        size: "sm",
        className: "h-8 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white",
        onClick: handleBeginExchangeProcessing,
        loading: startingExchange,
        disabled: startingExchange,
      });
    }

    if (canShowStartProcessing(status, tenantType) && status !== OrderStatus.EXCHANGE_REQUESTED) {
      const isAssigned = status === OrderStatus.ASSIGNED;
      descriptors.push({
        key: "provider-start-processing",
        type: "dialog",
        label: isAssigned ? "开始备货" : "开始换货",
        size: "sm",
        className: "bg-blue-600 hover:bg-blue-500 text-white",
        dialog: {
          title: isAssigned ? "确认开始备货?" : "确认开始换货?",
          description: "确认后，订单状态更新为\"备货中\"，表示您已开始准备该订单的商品。您可以编辑实际发货数量。",
        },
        onConfirm: handleStartProcessing,
        loading: processing,
        disabled: processing,
      });
    }

    if (isEditing && shouldEnterEditMode(status, tenantType)) {
      const providerTitle = status === OrderStatus.EXCHANGE_IN_PROGRESS ? "确认完成换货备货?" : "确认完成备货?";
      descriptors.push({
        key: "provider-finalize-quantities",
        type: "dialog",
        label: savingChanges ? "保存中..." : "完成备货",
        size: "sm",
        className: "bg-green-600 hover:bg-green-500 text-white flex items-center gap-1",
        dialog: {
          title: providerTitle,
          description: "提交后，系统将更新商品的实际出货量，总金额也会相应调整。",
          body: createSettlementSummary({
            actualTotal,
            discountTotal,
            originalTotal,
            returnMoney,
          }),
        },
        onConfirm: handleSaveActualQuantities,
        disabled: hasBlockingErrors || savingChanges,
        loading: savingChanges,
        icon: <Save className="h-4 w-4" />,
      });
    }

    return descriptors;
  }

  shouldShowInspectMenu(
    orderStatus: OrderStatus,
    inspections: any[],
    inspectionProgress: OrderStrategyContext["inspectionProgress"]
  ): boolean {
    // PROVIDER 租户通常不显示验收菜单
    return false;
  }

  shouldShowStatusColumn(
    orderStatus: OrderStatus,
    orderItems: OrderItem[],
    inspections: any[],
    inspectionProgress: OrderStrategyContext["inspectionProgress"]
  ): boolean {
    // PROVIDER 租户默认显示状态列
    return true;
  }

  getItemStatus(
    item: OrderItem,
    receiptStatus: string | undefined,
    orderStatus: OrderStatus,
    inspections?: any[]
  ): string {
    // PROVIDER 租户：从 inspections 数据中获取市场验收数量
    if (receiptStatus) {
      return receiptStatus;
    }
    if (inspections && inspections.length > 0) {
      const marketQty = parseFloat(getInspectedQuantity(item.id, 'MARKET', inspections as OrderInspection[]));
      if (marketQty > 0) {
        return 'SIGN';
      }
    }
    return 'PENDING';
  }
}

