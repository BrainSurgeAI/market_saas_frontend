import type { OrderStrategy, OrderStrategyContext } from "./OrderStrategy";
import type { ActionDescriptor } from "../types";
import type { OrderItem, OrderInspection } from "@/lib/types/orderStatus";
import { OrderStatus, TenantType } from "@/lib/types/orderStatus";
import { canShowCustomerBeginInspect, canShowCompleteOrder } from "@/lib/utils/orderStatusUtils";
import { buildCompletionAction } from "../helpers";
import { getInspectedQuantity } from "../roundGrouping";

export class CustomerOrderStrategy implements OrderStrategy {
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
      handleSubmitExchangeRequest,
      handleBeginInspect,
      completeAcceptance,
      showRejectConfirmation,
      requestCustomerExchange,
      requestingCustomerExchange,
      completeOrder,
    } = context;

    const descriptors: ActionDescriptor[] = [];

    // 注意：在 CUSTOMER_INSPECTING 状态下，如果 receipts 中有 EXCHANGE 类型的记录，
    // "申请换货"按钮由 buildCompletionAction 统一处理，这里不再单独添加，避免重复显示

    if (canShowCustomerBeginInspect(status, tenantType)) {
      descriptors.push({
        key: "customer-begin-inspect",
        type: "dialog",
        label: beginInspecting ? "处理中..." : "开始验收",
        size: "sm",
        className: "bg-blue-600 hover:bg-blue-500 text-white",
        dialog: {
          title: "确认开始验收?",
          description: "确认后，订单状态更新为\"客户验收中\"，表示您已开始验收该订单的商品。",
        },
        onConfirm: handleBeginInspect,
        disabled: beginInspecting,
        loading: beginInspecting,
      });
    }

    const completionAction = buildCompletionAction({
      tenant: TenantType.CUSTOMER,
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
      currentInspectionResult: context.currentInspectionResult,
    });
    if (completionAction) {
      descriptors.push(completionAction);
    }

    if (canShowCompleteOrder(status, tenantType)) {
      descriptors.push({
        key: "customer-complete-order",
        type: "dialog",
        label: "完成订单",
        variant: "outline",
        size: "sm",
        className: "h-8 px-2 text-xs flex items-center gap-1 hover:bg-green-600 bg-green-700 text-white hover:text-white",
        dialog: {
          title: "确认完成订单?",
          description: "确认后，订单状态将更新为\"已完成\"，此操作不可撤销。",
        },
        onConfirm: completeOrder,
      });
    }

    return descriptors;
  }

  shouldShowInspectMenu(
    orderStatus: OrderStatus,
    inspections: any[],
    inspectionProgress: OrderStrategyContext["inspectionProgress"]
  ): boolean {
    // CUSTOMER 用户：只在自己的验收状态下显示操作菜单
    if (orderStatus !== OrderStatus.CUSTOMER_INSPECTING) {
      return false;
    }

    // 在 CUSTOMER_INSPECTING 状态下，只要订单状态允许，就应该显示操作菜单
    // 具体每个商品是否显示操作菜单，由 ProductListSection 中的 actualStatus === "PENDING" 判断
    // 这里只判断是否应该显示操作菜单列
    return true;
  }

  shouldShowStatusColumn(
    orderStatus: OrderStatus,
    orderItems: OrderItem[],
    inspections: any[],
    inspectionProgress: OrderStrategyContext["inspectionProgress"]
  ): boolean {
    // CUSTOMER 用户：只基于 CUSTOMER 的验收结果判断
    
    // 如果有inspections数据，只检查 CUSTOMER 类型的验收结果
    if (inspections && inspections.length > 0) {
      // 只过滤 CUSTOMER 类型的验收记录
      const customerInspections = (inspections as OrderInspection[]).filter(
        (inspection) => inspection.inspectedByType?.toUpperCase() === 'CUSTOMER'
      );
      
      if (customerInspections.length > 0) {
        // 获取最新的CUSTOMER验收记录（使用 inspectionRound）
        const latestCustomerInspection = customerInspections.reduce((latest, current) => {
          const latestRound = latest.inspectionRound ?? 0;
          const currentRound = current.inspectionRound ?? 0;
          return currentRound >= latestRound ? current : latest;
        });
        
        const result = latestCustomerInspection.result?.toUpperCase();
        // 如果inspectionResult不是PENDING（已完成验收），显示状态列
        if (result && result !== 'PENDING') {
          return true;
        }
        
        // 检查是否有商品已签收（基于 CUSTOMER 的验收数据，不依赖 MARKET 的验收结果）
        const hasInspectedItems = orderItems.some(item => {
          const qty = parseFloat(getInspectedQuantity(item.id, 'CUSTOMER', customerInspections));
          return qty > 0;
        });
        if (hasInspectedItems) {
          return true;
        }
      }
    }

    // 如果没有 CUSTOMER 类型的 inspections 数据，默认显示状态列
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

    // 从 inspections 数据中获取客户验收数量（只使用 CUSTOMER 类型的验收数据）
    if (inspections && inspections.length > 0) {
      // 只过滤 CUSTOMER 类型的验收记录
      const customerInspections = (inspections as OrderInspection[]).filter(
        (inspection) => inspection.inspectedByType?.toUpperCase() === 'CUSTOMER'
      );
      
      if (customerInspections.length > 0) {
        // 检查最新的 CUSTOMER 验收记录是否有实际的验收数据（items 不为空）
        const latestCustomerInspection = customerInspections.reduce((latest, current) => {
          const latestRound = latest.inspectionRound ?? 0;
          const currentRound = current.inspectionRound ?? 0;
          return currentRound >= latestRound ? current : latest;
        });
        
        // 只有当最新的验收记录有 items 数据，且验收数量 > 0 时，才返回 SIGN
        // 如果 items 为空数组，说明 CUSTOMER 还没有验收，应该返回 PENDING
        if (latestCustomerInspection.items && latestCustomerInspection.items.length > 0) {
          const customerQty = parseFloat(getInspectedQuantity(item.id, 'CUSTOMER', customerInspections));
          if (customerQty > 0) {
            return 'SIGN';
          }
        }
        // 如果 items 为空数组，直接返回 PENDING，不检查数量
        return 'PENDING';
      }
    }

    return 'PENDING';
  }
}

