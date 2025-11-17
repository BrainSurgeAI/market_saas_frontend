import { OrderStatus, TenantType } from '@/lib/types/orderStatus';
import { 
  ORDER_FLOWS, 
  STATUS_TRANSITIONS, 
  EDITABLE_QUANTITY_STATUSES,
  INSPECTABLE_STATUSES,
  COUNTDOWN_STATUSES 
} from '@/lib/constants/orderStatus';

/**
 * 判断状态是否在最终态
 */
export function isFinalStatus(status: OrderStatus | string): boolean {
  return (ORDER_FLOWS.FINAL_STATES as OrderStatus[]).includes(status as OrderStatus);
}

/**
 * 判断是否可以转换状态
 */
export function canTransition(from: OrderStatus | string, to: OrderStatus | string): boolean {
  const transitions = STATUS_TRANSITIONS[from as OrderStatus] || [];
  return transitions.includes(to as OrderStatus);
}

/**
 * 获取下一个可能的状态列表
 */
export function getNextStatuses(current: OrderStatus | string): OrderStatus[] {
  return STATUS_TRANSITIONS[current as OrderStatus] || [];
}

/**
 * 判断订单是否可以编辑实际数量
 * @param status - 订单状态
 * @param tenantType - 租户类型
 * @param itemStatus - 商品状态（SIGN/RETURNED/EXCHANGED），如果有值表示已验收
 */
export function canEditQuantity(status: OrderStatus | string, tenantType: string, itemStatus?: string): boolean {
  // 如果商品已被当前租户验收（status 为 SIGN/RETURNED/EXCHANGED），则不能编辑
  if (itemStatus && ['SIGN', 'RETURNED'].includes(itemStatus)) {
    return false;
  }

  if (!(EDITABLE_QUANTITY_STATUSES as OrderStatus[]).includes(status as OrderStatus)) {
    return false;
  }

  const tenantLower = tenantType.toLowerCase();

  // SUPPLIER_PREPARING 和 EXCHANGE_IN_PROGRESS 只有 provider 可以编辑
  if (status === OrderStatus.SUPPLIER_PREPARING || status === OrderStatus.EXCHANGE_IN_PROGRESS) {
    return tenantLower === TenantType.PROVIDER;
  }

  // MARKET_INSPECTING 和 CUSTOMER_INSPECTING 都可以编辑
  return true;
}

/**
 * 判断是否显示编辑模式
 * @param status - 订单状态
 * @param tenantType - 租户类型
 * @param itemStatus - 商品状态，如果有值表示已验收
 */
export function shouldEnterEditMode(status: OrderStatus | string, tenantType: string, itemStatus?: string): boolean {
  // 如果商品已被验收，则不进入编辑模式
  if (itemStatus && ['SIGN', 'RETURNED'].includes(itemStatus)) {
    return false;
  }

  const tenantLower = tenantType.toLowerCase();
  
  // 供应商在备货状态或换货备货状态下可以编辑
  if ((status === OrderStatus.SUPPLIER_PREPARING || status === OrderStatus.EXCHANGE_IN_PROGRESS) && tenantLower === TenantType.PROVIDER) {
    return true;
  }

  // // 市场在验收状态下可以编辑（普通验收和换货验收都可以）
  // if ((status === OrderStatus.MARKET_INSPECTING || status === OrderStatus.EXCHANGE_INSPECTING) && tenantLower === TenantType.MARKET) {
  //   return true;
  // }

  // // 客户在验收状态下可以编辑
  // if (status === OrderStatus.CUSTOMER_INSPECTING && tenantLower === TenantType.CUSTOMER) {
  //   return true;
  // }

  return false;
}

/**
 * 判断是否显示检验操作菜单
 */
export function shouldShowInspectMenu(status: OrderStatus | string, tenantType: string): boolean {
  const tenantLower = tenantType.toLowerCase();
  const inspectableStatuses = new Set([OrderStatus.MARKET_INSPECTING, OrderStatus.EXCHANGE_INSPECTING, OrderStatus.CUSTOMER_INSPECTING]);

  // if (tenantLower === TenantType.PROVIDER) {
  //   return inspectableStatuses.has(status as OrderStatus);
  // }

  if (tenantLower === TenantType.MARKET) {
    return inspectableStatuses.has(status as OrderStatus);
  }

  if (tenantLower === TenantType.CUSTOMER) {
    return status === OrderStatus.CUSTOMER_INSPECTING;
  }

  return false;
}

/**
 * 判断是否显示市场接收和客户接收列
 */
export function shouldShowReceivedQuantityColumns(status: OrderStatus | string, tenantType: string): boolean {
  const tenantLower = tenantType.toLowerCase();
  const statusEnum = status as OrderStatus;
  
  // PROVIDER和MARKET用户在任何订单状态下都应该显示市场接收和客户接收列
  if (tenantLower === TenantType.PROVIDER || tenantLower === TenantType.MARKET) {
    return true;
  }
  
  // 显示接收数量列的状态（用于CUSTOMER用户）
  const showColumnsStatuses = new Set([
    OrderStatus.MARKET_INSPECTING,
    OrderStatus.EXCHANGE_INSPECTING,
    OrderStatus.CUSTOMER_INSPECTING,
    OrderStatus.MARKET_ACCEPTED,
  ]);

  if (tenantLower === TenantType.CUSTOMER) {
    return showColumnsStatuses.has(statusEnum);
  }

  return false;
}

/**
 * 判断是否显示实际数量列
 */
export function shouldDisplayActualQuantity(status: OrderStatus | string, tenantType: string): boolean {
  if (tenantType.toLowerCase() === TenantType.PROVIDER) {
    return ![OrderStatus.PENDING, OrderStatus.ASSIGNED].includes(status as OrderStatus);
  } else {
    return [
      OrderStatus.MARKET_INSPECTING,
      OrderStatus.EXCHANGE_INSPECTING,
      OrderStatus.CUSTOMER_INSPECTING,
      OrderStatus.MARKET_DELIVERING,
      OrderStatus.EXCHANGE_DELIVERING,
      OrderStatus.EXCHANGE_NEW_DELIVERING,
      OrderStatus.COMPLETED,
      OrderStatus.EXCHANGE_COMPLETED,
    ].includes(status as OrderStatus);
  }
}

/**
 * 判断是否显示倒计时
 */
export function shouldShowCountdown(status: OrderStatus | string): boolean {
  return (COUNTDOWN_STATUSES as OrderStatus[]).includes(status as OrderStatus);
}

/**
 * 判断状态是否在某个流程中
 */
export function isInFlow(status: OrderStatus | string, flow: 'NORMAL' | 'RETURN' | 'EXCHANGE'): boolean {
  return (ORDER_FLOWS[flow] as OrderStatus[]).includes(status as OrderStatus);
}

/**
 * 获取订单流程类型
 */
export function getFlowType(status: OrderStatus | string): 'NORMAL' | 'RETURN' | 'EXCHANGE' | 'FINAL' {
  if (isInFlow(status, 'RETURN')) return 'RETURN';
  if (isInFlow(status, 'EXCHANGE')) return 'EXCHANGE';
  if (isInFlow(status, 'NORMAL')) return 'NORMAL';
  return 'FINAL';
}

/**
 * 判断订单是否可以显示"开始备货"按钮
 */
export function canShowStartProcessing(status: OrderStatus | string, tenantType: string): boolean {
  return (
    tenantType.toLowerCase() === TenantType.PROVIDER &&
    [OrderStatus.ASSIGNED, OrderStatus.EXCHANGE_REQUESTED].includes(status as OrderStatus)
  );
}

/**
 * 判断订单是否可以显示"开始验收"按钮
 */
export function canShowBeginInspect(status: OrderStatus | string, tenantType: string): boolean {
  return (
    tenantType.toLowerCase() === TenantType.MARKET &&
    [OrderStatus.SUPPLIER_DELIVERING, OrderStatus.EXCHANGE_DELIVERING, OrderStatus.EXCHANGE_NEW_DELIVERING].includes(status as OrderStatus)
  );
}

export function canShowCustomerBeginInspect(status: OrderStatus | string, tenantType: string): boolean {
  return (
    tenantType.toLowerCase() === TenantType.CUSTOMER &&
    status === OrderStatus.MARKET_DELIVERING
  );
}

/**
 * 判断订单是否可以显示"完成验收"按钮
 */
export function canShowCompleteAcceptance(status: OrderStatus | string, tenantType: string): boolean {
  return (
    [OrderStatus.MARKET_INSPECTING, OrderStatus.EXCHANGE_INSPECTING, OrderStatus.CUSTOMER_INSPECTING]
      .includes(status as OrderStatus) &&
    [TenantType.MARKET, TenantType.CUSTOMER].includes(tenantType.toLowerCase() as TenantType)
  );
}

/**
 * 判断订单是否可以显示"完成订单"按钮
 */
export function canShowCompleteOrder(status: OrderStatus | string, tenantType: string): boolean {
  return (
    status === OrderStatus.RETURN_REQUESTED &&
    tenantType.toLowerCase() === TenantType.CUSTOMER
  );
}

/**
 * 判断是否可以显示“配送至客户”按钮
 */
export function canShowDeliverToCustomer(status: OrderStatus | string, tenantType: string): boolean {
  return tenantType.toLowerCase() === TenantType.MARKET && status === OrderStatus.MARKET_ACCEPTED;
}
