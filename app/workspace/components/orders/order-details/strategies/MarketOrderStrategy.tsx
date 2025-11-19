import type { OrderStrategy, OrderStrategyContext } from "./OrderStrategy";
import type { ActionDescriptor } from "../types";
import type { OrderItem, OrderInspection } from "@/lib/types/orderStatus";
import { OrderStatus, TenantType } from "@/lib/types/orderStatus";
import { canShowBeginInspect, canShowDeliverToCustomer } from "@/lib/utils/orderStatusUtils";
import { buildCompletionAction } from "../helpers";
import { getInspectedQuantity } from "../roundGrouping";

export class MarketOrderStrategy implements OrderStrategy {
  getActionDescriptors(context: OrderStrategyContext): ActionDescriptor[] {
    const {
      orderDetail,
      orderItems,
      returnExchangeRecords,
      productStatusSummary,
      inspectionProgress,
      rawReceipts,
      status,
      tenantType,
      submittingExchangeRequest,
      beginInspecting,
      deliveringToCustomer,
      shouldShowMarketExchangeConfirmation,
      handleSubmitExchangeRequest,
      handleBeginInspect,
      navigateToMarketExchangePage,
      deliverToCustomer,
      completeAcceptance,
      showRejectConfirmation,
      requestCustomerExchange,
      requestingCustomerExchange,
    } = context;

    const descriptors: ActionDescriptor[] = [];

    // 注意：在 MARKET_INSPECTING 状态下，如果 receipts 中有 EXCHANGE 类型的记录，
    // "提交换货申请"按钮由 buildCompletionAction 统一处理，这里不再单独添加，避免重复显示

    // EXCHANGE_DELIVERING状态下的"开始验收"按钮显示在退换货记录card上，不在这里显示
    if (canShowBeginInspect(status, tenantType) && status !== OrderStatus.EXCHANGE_DELIVERING) {
      descriptors.push({
        key: "market-begin-inspect",
        type: "dialog",
        label: beginInspecting ? "处理中..." : "开始验收",
        size: "sm",
        className: "bg-blue-600 hover:bg-blue-500 text-white",
        dialog: {
          title: "确认开始验收?",
          description: "确认后，订单状态更新为\"验收中\"，表示您已开始验收该订单的商品。",
        },
        onConfirm: handleBeginInspect,
        disabled: beginInspecting,
        loading: beginInspecting,
      });
    }

    if (shouldShowMarketExchangeConfirmation) {
      descriptors.push({
        key: "market-confirm-exchange",
        type: "dialog",
        label: "确认换货",
        size: "sm",
        className: "bg-purple-600 hover:bg-purple-500 text-white",
        dialog: {
          title: "确认进入换货流程?",
          description: "确认后将跳转至换货处理页面，请核对需要换货的商品信息并提交换货申请。",
        },
        onConfirm: navigateToMarketExchangePage,
      });
    } else if (canShowDeliverToCustomer(status, tenantType)) {
      descriptors.push({
        key: "market-deliver-to-customer",
        type: "dialog",
        label: deliveringToCustomer ? "处理中..." : "确认发货",
        size: "sm",
        className: "bg-purple-600 hover:bg-purple-500 text-white",
        dialog: {
          title: "确认开始发货?",
          description: "确认后，订单状态将更新为\"配送中\"，表示市场正在将商品配送给客户。",
        },
        onConfirm: deliverToCustomer,
        disabled: deliveringToCustomer,
        loading: deliveringToCustomer,
      });
    }

    const completionAction = buildCompletionAction({
      tenant: TenantType.MARKET,
      status,
      returnExchangeRecords,
      orderItems,
      completeAcceptance,
      showRejectConfirmation,
      productStatusSummary,
      requestCustomerExchange,
      requestingCustomerExchange,
      inspectionProgress,
      inspections: context.inspections,
      deliveries: context.deliveries,
      receipts: context.rawReceipts,
      orderCode: context.orderCode,
    });
    if (completionAction) {
      descriptors.push(completionAction);
    }

    return descriptors;
  }

  shouldShowInspectMenu(
    orderStatus: OrderStatus,
    inspections: any[],
    inspectionProgress: OrderStrategyContext["inspectionProgress"]
  ): boolean {
    const inspectableStatuses = new Set([
      OrderStatus.MARKET_INSPECTING,
      OrderStatus.EXCHANGE_INSPECTING,
      OrderStatus.CUSTOMER_INSPECTING,
    ]);

    if (!inspectableStatuses.has(orderStatus)) {
      return false;
    }

    // 在验收状态下，只要订单状态允许，就应该显示操作菜单
    // 具体每个商品是否显示操作菜单，由 ProductListSection 中的 actualStatus === "PENDING" 判断
    // 这里只判断是否应该显示操作菜单列
    if (orderStatus === OrderStatus.MARKET_INSPECTING || orderStatus === OrderStatus.EXCHANGE_INSPECTING) {
      return true;
    }

    return false;
  }

  shouldShowStatusColumn(
    orderStatus: OrderStatus,
    orderItems: OrderItem[],
    inspections: any[],
    inspectionProgress: OrderStrategyContext["inspectionProgress"]
  ): boolean {
    // 如果有inspections数据，根据inspectionResult判断
    if (inspections && inspections.length > 0) {
      const result = inspectionProgress.marketInspectionResult;
      // 如果inspectionResult不是PENDING（已完成验收），显示状态列
      if (result !== null && result !== 'PENDING') {
        return true;
      }
    }

    // 检查是否有商品已签收（基于 inspections 数据）
    if (orderStatus === OrderStatus.MARKET_INSPECTING && inspections && inspections.length > 0) {
      const hasInspectedItems = orderItems.some(item => {
        const qty = parseFloat(getInspectedQuantity(item.id, 'MARKET', inspections as OrderInspection[]));
        return qty > 0;
      });
      if (hasInspectedItems) {
        return true;
      }
    }

    // 如果没有inspections数据且没有已签收的商品，默认显示状态列
    return true;
  }

  getItemStatus(
    item: OrderItem,
    receiptStatus: string | undefined,
    orderStatus: OrderStatus,
    inspections?: any[]
  ): string {
    if (receiptStatus) {
      return receiptStatus;
    }

    // 从 inspections 数据中获取市场验收数量
    if (inspections && inspections.length > 0) {
      const marketQty = parseFloat(getInspectedQuantity(item.id, 'MARKET', inspections as OrderInspection[]));
      if (marketQty > 0) {
        return 'SIGN';
      }
    }

    return 'PENDING';
  }
}

