import { Delivery, OrderInspection, OrderItem, Receipt, ReceiptItem } from "@/lib/types/orderStatus";

/**
 * 按轮数分组的数据结构
 */
export interface RoundGroupedData {
  round: number;
  isLatest: boolean;
  deliveryStatus?: string;
  deliveries: Delivery[];
  inspections: OrderInspection[];
  items: OrderItem[];
}

/**
 * 获取最大轮数
 * 对于inspections，有parent_id的记录应该和父记录放在同一轮，所以只计算没有parent_id的记录
 */
export function getMaxRound(
  deliveries: Delivery[],
  inspections: OrderInspection[]
): number {
  const maxDeliveryRound = deliveries.length > 0
    ? Math.max(...deliveries.map(d => d.deliveryRound))
    : 0;
  
  // 只计算没有parent_id的inspections的轮数（这些是独立的轮次）
  const independentInspections = inspections.filter(i => !i.parent_id);
  const maxInspectionRound = independentInspections.length > 0
    ? Math.max(...independentInspections.map(i => i.inspectionRound || 0))
    : 0;
  
  return Math.max(maxDeliveryRound, maxInspectionRound, 1);
}

/**
 * 按轮数分组数据
 * 分组规则：
 * 1. 有parent_id的inspection和其父inspection（inspectionId等于parent_id）应该放在同一轮
 * 2. 没有parent_id的inspection单独作为一轮
 */
export function groupByRound(
  deliveries: Delivery[],
  inspections: OrderInspection[],
  orderItems: OrderItem[],
  receipts: any[]
): RoundGroupedData[] {
  const maxRound = getMaxRound(deliveries, inspections);
  const groups: RoundGroupedData[] = [];

  // 创建一个映射：inspectionId -> inspection，方便查找父inspection
  const inspectionMap = new Map<number, OrderInspection>();
  inspections.forEach(inspection => {
    inspectionMap.set(inspection.inspectionId, inspection);
  });

  // 从第1轮到最大轮数
  for (let round = 1; round <= maxRound; round++) {
    const roundDeliveries = deliveries.filter(d => d.deliveryRound === round);
    
    // 获取该轮次的inspections
    // 直接查找inspectionRound等于round的inspections
    const roundInspections: OrderInspection[] = [];

    inspections.forEach(inspection => {
      if ((inspection.inspectionRound || 0) === round) {
        roundInspections.push(inspection);
      }
    });

    // 获取该轮次配送的商品ID集合
    const roundDeliveryItemIds = new Set<number>();
    roundDeliveries.forEach(delivery => {
      delivery.items.forEach(item => {
        roundDeliveryItemIds.add(item.orderDetailId);
      });
    });

    // 获取该轮次验收的商品ID集合
    const roundInspectionItemIds = new Set<number>();
    roundInspections.forEach(inspection => {
      if (inspection.items && Array.isArray(inspection.items)) {
        inspection.items.forEach(item => {
        roundInspectionItemIds.add(item.orderDetailId);
      });
      }
    });

    // 如果该轮有 EXCHANGE 类型的 deliveries，从 receipts 中获取换货商品ID
    const hasExchangeDelivery = roundDeliveries.some(d => d.deliveryType === 'EXCHANGE');
    const exchangeReceiptItemIds = new Set<number>();
    if (hasExchangeDelivery && receipts) {
      receipts.forEach(receipt => {
        if (receipt.operationType === 'EXCHANGE' && receipt.items) {
          receipt.items.forEach((receiptItem: any) => {
            // 通过 productId 找到对应的 orderItem，获取其 id
            const orderItem = orderItems.find(item => item.productId === receiptItem.productId);
            if (orderItem) {
              exchangeReceiptItemIds.add(orderItem.id);
            }
          });
        }
      });
    }

    // 合并该轮次涉及的商品ID
    const roundItemIds = new Set([
      ...roundDeliveryItemIds,
      ...roundInspectionItemIds,
      ...exchangeReceiptItemIds
    ]);

    // 获取该轮次涉及的商品
    // 如果该轮有 EXCHANGE 类型的 deliveries 且没有其他商品，显示所有商品（用于编辑换货数量）
    let roundItems: OrderItem[];
    if (hasExchangeDelivery && roundItemIds.size === 0) {
      // EXCHANGE 轮次且没有其他商品，显示所有商品
      roundItems = orderItems;
    } else {
      roundItems = orderItems.filter(item => roundItemIds.has(item.id));
    }

    groups.push({
      round,
      isLatest: round === maxRound,
      deliveries: roundDeliveries,
      inspections: roundInspections,
      items: roundItems,
    });
  }

  return groups;
}

/**
 * 获取最新轮数的退换货记录（receipts 总是最新轮数的）
 */
export function getLatestRoundReceipts(receipts: any[]): any[] {
  // receipts 总是最新轮数的退换货商品
  return receipts || [];
}

/**
 * 获取最近一轮的deliveries中的商品数量（去重后的orderDetailId数量）
 * @param deliveries 所有配送记录
 * @returns 最近一轮配送的商品数量
 */
export function getLatestRoundDeliveryItemCount(deliveries: Delivery[]): number {
  if (!deliveries || deliveries.length === 0) {
    return 0;
  }
  
  // 找到最大轮数
  const maxRound = Math.max(...deliveries.map(d => d.deliveryRound || 1));
  
  // 获取最近一轮的deliveries
  const latestRoundDeliveries = deliveries.filter(d => d.deliveryRound === maxRound);
  
  // 收集所有唯一的orderDetailId
  const itemIds = new Set<number>();
  latestRoundDeliveries.forEach(delivery => {
    delivery.items.forEach(item => {
      itemIds.add(item.orderDetailId);
    });
  });
  
  return itemIds.size;
}

/**
 * 检查是否所有商品都已验收（基于inspections、receipts和sessionStorage）
 * @param inspectedByType 验收类型（MARKET 或 CUSTOMER）
 * @param inspections inspections数组
 * @param deliveries deliveries数组
 * @param receipts receipts数组（包含退换货记录）
 * @param orderItems orderItems数组（用于将productId映射到orderDetailId）
 * @param orderCode 订单编号
 * @returns 是否所有商品都已验收
 */
export function areAllItemsInspected(
  inspectedByType: string,
  inspections: OrderInspection[],
  deliveries: Delivery[],
  receipts: Receipt[],
  orderItems: OrderItem[],
  orderCode: string
): boolean {
  // 获取最近一轮的商品数量
  const latestRoundItemCount = getLatestRoundDeliveryItemCount(deliveries);
  if (latestRoundItemCount === 0) {
    return false;
  }

  // 创建 productId 到 orderDetailId 的映射
  const productIdToOrderDetailId = new Map<string, number>();
  orderItems.forEach(item => {
    productIdToOrderDetailId.set(item.productId, item.id);
  });

  // 从inspections中获取已验收的商品数量（SIGN操作）
  const processedItemIds = new Set<number>();
  if (inspections && inspections.length > 0) {
    inspections.forEach(inspection => {
      if (
        inspection.inspectedByType?.toUpperCase() === inspectedByType.toUpperCase() &&
        inspection.items &&
        Array.isArray(inspection.items)
      ) {
        inspection.items.forEach(item => {
          if (item.orderDetailId) {
            processedItemIds.add(item.orderDetailId);
          }
        });
      }
    });
  }
  
  // 从receipts中获取退换货的商品数量（RETURN和EXCHANGE操作）
  if (receipts && receipts.length > 0) {
    receipts.forEach(receipt => {
      // receipts中的operationType是RETURN或EXCHANGE，这些商品也算作已处理
      if (receipt.operationType === 'RETURN' || receipt.operationType === 'EXCHANGE') {
        receipt.items.forEach(receiptItem => {
          const orderDetailId = productIdToOrderDetailId.get(receiptItem.productId);
          if (orderDetailId !== undefined) {
            processedItemIds.add(orderDetailId);
          }
        });
      }
    });
  }
  
  // 从sessionStorage中获取已验收的商品数量（SIGN操作）
  try {
    const existingRecordsString = sessionStorage.getItem('returnExchangeItems');
    if (existingRecordsString) {
      const records: any[] = JSON.parse(existingRecordsString);
      records.forEach(record => {
        if (
          record.orderId === orderCode &&
          record.operationType === 'SIGN' &&
          record.id
        ) {
          processedItemIds.add(record.id);
        }
      });
    }
  } catch (e) {
    console.error('读取sessionStorage数据出错:', e);
  }
  
  // 检查已处理的商品数量是否等于最近一轮的商品数量
  return processedItemIds.size >= latestRoundItemCount;
}

/**
 * 从指定轮数的 delivery items 中获取商品的发货数量
 * @param orderDetailId 订单详情ID
 * @param deliveries 该轮次的配送记录数组
 * @returns 该商品在该轮次的总发货数量
 */
export function getDeliveredQuantityFromRound(
  orderDetailId: number,
  deliveries: Delivery[]
): string {
  let totalQuantity = 0;
  
  deliveries.forEach(delivery => {
    delivery.items.forEach(item => {
      if (item.orderDetailId === orderDetailId) {
        totalQuantity += parseFloat(item.actualQty || "0");
      }
    });
  });

  
  return totalQuantity.toFixed(2);
}

/**
 * 从指定轮数的 inspections 中获取 MARKET 用户的市场接收数量
 * @param orderDetailId 订单详情ID
 * @param inspectedByType 验收类型（MARKET 或 CUSTOMER）
 * @param inspections 该轮次的验收记录数组
 * @returns 该商品在该轮次的市场接收数量
 */
export function getReceivedQuantityFromRound(
  orderDetailId: number,
  inspectedByType: string,
  inspections: OrderInspection[]
): string {
  let totalQuantity = 0;
  if (inspections.length === 0) {
    return "0";
  }

  inspections.forEach(inspection => {
    if (inspection.inspectedByType?.toUpperCase() === inspectedByType && inspection.items) {
      inspection.items.forEach(item => {
        if (item.orderDetailId === orderDetailId) {
          // 优先使用 quantity，如果没有则使用 inspectedQty（向后兼容）
          const qty = parseFloat(item.quantity || item.inspectedQty || "0");
          totalQuantity += qty;
        }
      });
    }
  });

  return totalQuantity.toFixed(2);
}

/**
 * 从所有 inspections 中获取指定商品的验收数量
 * @param orderDetailId 订单详情ID
 * @param inspectedByType 验收类型（MARKET 或 CUSTOMER）
 * @param inspections 所有验收记录数组
 * @returns 该商品的总验收数量
 */
export function getInspectedQuantity(
  orderDetailId: number,
  inspectedByType: string,
  inspections: OrderInspection[]
): string {
  let totalQuantity = 0;
  if (inspections.length === 0) {
    return "0";
  }
  
  inspections.forEach(inspection => {
    if (inspection.inspectedByType?.toUpperCase() === inspectedByType && inspection.items) {
      inspection.items.forEach(item => {
        if (item.orderDetailId === orderDetailId) {
          // 优先使用 quantity，如果没有则使用 inspectedQty（向后兼容）
          const qty = parseFloat(item.quantity || item.inspectedQty || "0");
          totalQuantity += qty;
        }
      });
    }
  });
  
  return totalQuantity.toFixed(2);
}

/**
 * 从所有 inspections 中获取指定商品的验收数量（用于显示，如果没有数据返回空字符串）
 * @param orderDetailId 订单详情ID
 * @param inspectedByType 验收类型（MARKET 或 CUSTOMER）
 * @param inspections 所有验收记录数组
 * @returns 该商品的总验收数量，如果没有数据返回空字符串（用于显示"-"）
 */
export function getInspectedQuantityForDisplay(
  orderDetailId: number,
  inspectedByType: string,
  inspections: OrderInspection[]
): string {
  if (!inspections || inspections.length === 0) {
    return "";
  }
  
  let totalQuantity = 0;
  let hasData = false;
  
  inspections.forEach(inspection => {
    if (inspection.inspectedByType?.toUpperCase() === inspectedByType.toUpperCase() && inspection.items && inspection.items.length > 0) {
      inspection.items.forEach(item => {
        if (item.orderDetailId === orderDetailId) {
          // 优先使用 quantity，如果没有则使用 inspectedQty（向后兼容）
          const qty = parseFloat(item.quantity || item.inspectedQty || "0");
          if (qty > 0) {
            totalQuantity += qty;
            hasData = true;
          }
        }
      });
    }
  });
  
  if (!hasData || totalQuantity === 0) {
    return "";
  }
  
  return totalQuantity.toFixed(2);
}

/**
 * 获取CUSTOMER的实际到货量（从MARKET的验收记录中获取）
 * 逻辑：
 * 1. 找到CUSTOMER类型的最近轮记录（inspectionRound最大的）
 * 2. 获取它的parent_id
 * 3. 找到inspectionId等于parent_id的记录（应该是MARKET的记录）
 * 4. 从MARKET的items中找到对应的orderDetailId的item
 * 5. 获取inspectedQty
 */
export function getCustomerActualDeliveredQuantity(
  orderDetailId: number,
  inspections: OrderInspection[]
): string {
  if (!inspections || inspections.length === 0) {
    return "0";
  }

  // 1. 找到CUSTOMER类型的最近轮记录（inspectionRound最大的）
  const customerInspections = inspections.filter(
    (inspection) => inspection.inspectedByType?.toUpperCase() === 'CUSTOMER'
  );

  if (customerInspections.length === 0) {
    return "0";
  }

  // 获取最新的CUSTOMER验收记录（使用 inspectionRound）
  const latestCustomerInspection = customerInspections.reduce((latest, current) => {
    const latestRound = latest.inspectionRound ?? 0;
    const currentRound = current.inspectionRound ?? 0;
    return currentRound >= latestRound ? current : latest;
  });

  // 2. 获取它的parent_id
  const parentId = latestCustomerInspection.parent_id;
  if (!parentId) {
    return "0";
  }

  // 3. 找到inspectionId等于parent_id的记录（应该是MARKET的记录）
  const parentInspection = inspections.find(
    (inspection) => inspection.inspectionId === parentId
  );

  if (!parentInspection || !parentInspection.items || parentInspection.items.length === 0) {
    return "0";
  }

  // 4. 从MARKET的items中找到对应的orderDetailId的item
  const item = parentInspection.items.find(
    (item) => item.orderDetailId === orderDetailId
  );

  if (!item) {
    return "0";
  }

  // 5. 获取inspectedQty（优先使用 quantity，如果没有则使用 inspectedQty）
  const qty = parseFloat(item.quantity || item.inspectedQty || "0");
  return qty.toFixed(2);
}

/**
 * 获取CUSTOMER的收货量（从inspections的最近轮中获取）
 * 逻辑：
 * 1. 找到CUSTOMER类型的最近轮记录（inspectionRound最大的）
 * 2. 从该记录的items中找到对应的orderDetailId的item
 * 3. 获取inspectedQty
 * 如果items为空，返回空字符串（用于显示"-"）
 */
export function getCustomerReceivedQuantity(
  orderDetailId: number,
  inspections: OrderInspection[]
): string {
  if (!inspections || inspections.length === 0) {
    return "";
  }

  // 1. 找到CUSTOMER类型的最近轮记录（inspectionRound最大的）
  const customerInspections = inspections.filter(
    (inspection) => inspection.inspectedByType?.toUpperCase() === 'CUSTOMER'
  );

  if (customerInspections.length === 0) {
    return "";
  }

  // 获取最新的CUSTOMER验收记录（使用 inspectionRound）
  const latestCustomerInspection = customerInspections.reduce((latest, current) => {
    const latestRound = latest.inspectionRound ?? 0;
    const currentRound = current.inspectionRound ?? 0;
    return currentRound >= latestRound ? current : latest;
  });

  // 2. 检查items是否为空
  if (!latestCustomerInspection.items || latestCustomerInspection.items.length === 0) {
    return "";
  }

  // 3. 从items中找到对应的orderDetailId的item
  const item = latestCustomerInspection.items.find(
    (item) => item.orderDetailId === orderDetailId
  );

  if (!item) {
    return "";
  }

  // 4. 获取inspectedQty（优先使用 quantity，如果没有则使用 inspectedQty）
  const qty = parseFloat(item.quantity || item.inspectedQty || "0");
  return qty.toFixed(2);
}

/**
 * 获取PROVIDER的客户签收数量
 * 逻辑：
 * 1. 找到inspectedByType为MARKET的记录
 * 2. 检查该记录的inspectionId是否在inspections中有parent_id等于该inspectionId的记录
 * 3. 如果有，从CUSTOMER类型的记录中获取签收数量
 * 4. 如果inspections为空，或找不到对应的CUSTOMER记录，返回空字符串（用于显示"-"）
 */
export function getProviderCustomerSignQuantity(
  orderDetailId: number,
  inspections: OrderInspection[]
): string {
  if (!inspections || inspections.length === 0) {
    return "";
  }

  // 1. 找到inspectedByType为MARKET的记录
  const marketInspections = inspections.filter(
    (inspection) => inspection.inspectedByType?.toUpperCase() === 'MARKET'
  );

  if (marketInspections.length === 0) {
    return "";
  }

  // 获取最新的MARKET验收记录（使用 inspectionRound）
  const latestMarketInspection = marketInspections.reduce((latest, current) => {
    const latestRound = latest.inspectionRound ?? 0;
    const currentRound = current.inspectionRound ?? 0;
    return currentRound >= latestRound ? current : latest;
  });

  // 2. 检查该记录的inspectionId是否在inspections中有parent_id等于该inspectionId的记录
  const marketInspectionId = latestMarketInspection.inspectionId;
  const customerInspection = inspections.find(
    (inspection) => inspection.parent_id === marketInspectionId && 
                     inspection.inspectedByType?.toUpperCase() === 'CUSTOMER'
  );

  // 3. 如果找不到对应的CUSTOMER记录，返回空字符串
  if (!customerInspection) {
    return "";
  }

  // 4. 从CUSTOMER记录的items中找到对应的orderDetailId的item
  if (!customerInspection.items || customerInspection.items.length === 0) {
    return "";
  }

  const item = customerInspection.items.find(
    (item) => item.orderDetailId === orderDetailId
  );

  if (!item) {
    return "";
  }

  // 5. 获取inspectedQty（优先使用 quantity，如果没有则使用 inspectedQty）
  const qty = parseFloat(item.quantity || item.inspectedQty || "0");
  return qty.toFixed(2);
}

/**
 * 从 receipts 中获取换货数量
 * @param productId 商品ID
 * @param receipts receipts数组
 * @returns 换货数量，如果没有数据返回空字符串（用于显示"-"）
 */
export function getExchangeQuantityFromReceipts(
  productId: string,
  receipts: Receipt[]
): string {
  if (!receipts || receipts.length === 0) {
    return "";
  }

  let totalQuantity = 0;
  let hasData = false;

  receipts.forEach(receipt => {
    if (receipt.operationType === 'EXCHANGE' && receipt.items && Array.isArray(receipt.items)) {
      receipt.items.forEach((item: ReceiptItem) => {
        if (item.productId === productId) {
          const qty = parseFloat(item.quantity || "0");
          if (qty > 0) {
            totalQuantity += qty;
            hasData = true;
          }
        }
      });
    }
  });

  if (!hasData || totalQuantity === 0) {
    return "";
  }

  return totalQuantity.toFixed(2);
}
