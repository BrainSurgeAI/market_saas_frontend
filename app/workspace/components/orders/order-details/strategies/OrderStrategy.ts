import type { ActionDescriptor, ProductStatusSummary } from "../types";
import type { Order, OrderItem, ReturnExchangeItem, Delivery, Receipt } from "@/lib/types/orderStatus";
import { OrderStatus } from "@/lib/types/orderStatus";

export interface OrderStrategyContext {
  orderDetail: Order;
  orderItems: OrderItem[];
  returnExchangeRecords: ReturnExchangeItem[];
  productStatusSummary: ProductStatusSummary;
  inspectionProgress: {
    marketCompleted: boolean;
    customerCompleted: boolean;
    marketInspectionResult: string | null;
    customerInspectionResult: string | null;
  };
  currentInspectionResult: string | null; // 当前验收结果（基于API返回的data字段）
  rawReceipts?: Receipt[];
  deliveries?: Delivery[];
  orderCode?: string;
  isEditing: boolean;
  savingChanges: boolean;
  hasErrors: () => boolean;
  // 各种状态和函数
  [key: string]: any;
}

export interface OrderStrategy {
  /**
   * 获取该租户在当前订单状态下应该显示的操作按钮
   */
  getActionDescriptors(context: OrderStrategyContext): ActionDescriptor[];

  /**
   * 判断是否应该显示操作菜单
   */
  shouldShowInspectMenu(
    orderStatus: OrderStatus,
    inspections: any[],
    inspectionProgress: OrderStrategyContext["inspectionProgress"]
  ): boolean;

  /**
   * 判断是否应该显示状态列
   */
  shouldShowStatusColumn(
    orderStatus: OrderStatus,
    orderItems: OrderItem[],
    inspections: any[],
    inspectionProgress: OrderStrategyContext["inspectionProgress"]
  ): boolean;

  /**
   * 判断商品状态（用于 productStatusSummary）
   */
  getItemStatus(
    item: OrderItem,
    receiptStatus: string | undefined,
    orderStatus: OrderStatus,
    inspections?: any[]
  ): string;
}

