import { OrderStatus } from '@/lib/types/orderStatus';

// === 订单流程定义 ===
export const ORDER_FLOWS = {
  NORMAL: [
    OrderStatus.PENDING,
    OrderStatus.ASSIGNED,
    OrderStatus.SUPPLIER_PREPARING,
    OrderStatus.SUPPLIER_DELIVERING,
    OrderStatus.MARKET_INSPECTING,
    OrderStatus.MARKET_ACCEPTED,
    OrderStatus.MARKET_DELIVERING,
    OrderStatus.CUSTOMER_INSPECTING,
    OrderStatus.COMPLETED,
  ] as OrderStatus[],
  RETURN: [
    OrderStatus.RETURN_REQUESTED,
    OrderStatus.RETURNED,
  ] as OrderStatus[],
  EXCHANGE: [
    OrderStatus.EXCHANGE_REQUESTED,
    OrderStatus.EXCHANGE_IN_PROGRESS,
    OrderStatus.EXCHANGE_DELIVERING,
    OrderStatus.EXCHANGE_INSPECTING,
    OrderStatus.EXCHANGE_NEW_DELIVERING,
    OrderStatus.EXCHANGE_COMPLETED,
  ] as OrderStatus[],
  FINAL_STATES: [
    OrderStatus.COMPLETED,
    OrderStatus.RETURNED,
    OrderStatus.EXCHANGE_COMPLETED,
    OrderStatus.CANCELLED,
  ] as OrderStatus[],
};

// === 状态转换规则 ===
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED]: [OrderStatus.SUPPLIER_PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.SUPPLIER_PREPARING]: [OrderStatus.SUPPLIER_DELIVERING],
  [OrderStatus.SUPPLIER_DELIVERING]: [OrderStatus.MARKET_INSPECTING],
  [OrderStatus.MARKET_INSPECTING]: [
    OrderStatus.MARKET_ACCEPTED,
    OrderStatus.RETURN_REQUESTED,
    OrderStatus.EXCHANGE_REQUESTED,
  ],
  [OrderStatus.MARKET_ACCEPTED]: [OrderStatus.MARKET_DELIVERING],
  [OrderStatus.MARKET_DELIVERING]: [OrderStatus.CUSTOMER_INSPECTING],
  [OrderStatus.CUSTOMER_INSPECTING]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],

  [OrderStatus.RETURN_REQUESTED]: [OrderStatus.RETURNED],
  [OrderStatus.RETURNED]: [],

  [OrderStatus.EXCHANGE_REQUESTED]: [OrderStatus.EXCHANGE_IN_PROGRESS],
  [OrderStatus.EXCHANGE_IN_PROGRESS]: [OrderStatus.EXCHANGE_DELIVERING],
  [OrderStatus.EXCHANGE_DELIVERING]: [OrderStatus.EXCHANGE_INSPECTING],
  [OrderStatus.EXCHANGE_INSPECTING]: [OrderStatus.EXCHANGE_NEW_DELIVERING],
  [OrderStatus.EXCHANGE_NEW_DELIVERING]: [OrderStatus.EXCHANGE_COMPLETED],
  [OrderStatus.EXCHANGE_COMPLETED]: [],

  [OrderStatus.CANCELLED]: [],
};

// === 状态显示标签 ===
export const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '待分配',
  [OrderStatus.ASSIGNED]: '已分配',
  [OrderStatus.SUPPLIER_PREPARING]: '备货中',
  [OrderStatus.SUPPLIER_DELIVERING]: '配送中',
  [OrderStatus.MARKET_INSPECTING]: '验收中',
  [OrderStatus.MARKET_ACCEPTED]: '已验收',
  [OrderStatus.MARKET_DELIVERING]: '配送中',
  [OrderStatus.CUSTOMER_INSPECTING]: '客户验收中',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.RETURN_REQUESTED]: '退货申请',
  [OrderStatus.RETURNED]: '已退货',
  [OrderStatus.EXCHANGE_REQUESTED]: '换货申请',
  [OrderStatus.EXCHANGE_IN_PROGRESS]: '换货备货中',
  [OrderStatus.EXCHANGE_DELIVERING]: '换货配送中',
  [OrderStatus.EXCHANGE_INSPECTING]: '换货验收中',
  [OrderStatus.EXCHANGE_NEW_DELIVERING]: '新品配送中',
  [OrderStatus.EXCHANGE_COMPLETED]: '换货完成',
  [OrderStatus.CANCELLED]: '已取消',
};

// === 可编辑实际数量的状态 ===
export const EDITABLE_QUANTITY_STATUSES: OrderStatus[] = [
  OrderStatus.SUPPLIER_PREPARING,
  OrderStatus.EXCHANGE_IN_PROGRESS,
  OrderStatus.MARKET_INSPECTING,
  OrderStatus.CUSTOMER_INSPECTING,
];

// === 可操作检验的状态 ===
export const INSPECTABLE_STATUSES: OrderStatus[] = [
  OrderStatus.MARKET_INSPECTING,
  OrderStatus.EXCHANGE_INSPECTING,
  OrderStatus.CUSTOMER_INSPECTING,
];

// === 显示倒计时的状态 ===
export const COUNTDOWN_STATUSES: OrderStatus[] = [
  OrderStatus.RETURN_REQUESTED,
];
