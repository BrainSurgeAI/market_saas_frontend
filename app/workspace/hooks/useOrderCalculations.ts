import { useMemo } from 'react';
import { OrderItem, ReturnExchangeItem, OrderInspection } from '@/lib/types/orderStatus';
import { RoundGroupedData, getInspectedQuantityForDisplay, getReceivedQuantityFromRound, getDeliveredQuantityFromRound, getCustomerReceivedQuantity } from '@/app/workspace/components/orders/order-details/roundGrouping';

export function useOrderCalculations(
  orderItems: OrderItem[],
  returnExchangeRecords: ReturnExchangeItem[],
  isEditing: boolean,
  inspections: OrderInspection[] = [],
  roundGroups: RoundGroupedData[] = [],
  tenantType?: string
) {
  // 计算退货金额
  const returnMoney = useMemo(() => {
    return returnExchangeRecords
      .filter(r => r.operationType === 'RETURN')
      .reduce((acc, record) => {
        const item = orderItems.find(item => item.id === record.id);
        if (!item) return acc;
        return acc + parseFloat(item.discountedUnitPrice) * record.quantity;
      }, 0)
      .toFixed(2);
  }, [returnExchangeRecords, orderItems]);

  // 判断是否显示退货金额
  const shouldDisplayReturnMoney = useMemo(() => {
    return parseFloat(returnMoney) > 0;
  }, [returnMoney]);

  // 计算实际总额
  const calculateActualTotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => {
      const actualTotal = parseFloat(item.discountedUnitPrice) * parseFloat(item.acceptedQuantity);
      return isNaN(actualTotal) ? sum : sum + actualTotal;
    }, 0).toFixed(2);
  };

  // 计算原始总额
  const calculateOriginalTotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => {
      if (!item.acceptedQuantity || isNaN(parseFloat(item.acceptedQuantity))) return sum;

      const quantity = parseFloat(item.acceptedQuantity);
      const price = parseFloat(item.unitPrice);
      return sum + (quantity * price);
    }, 0).toFixed(2);
  };

  // 计算折扣总额
  const calculateDiscountTotal = (originalTotal: number, actualTotal: number) => {
    return Math.max(0, originalTotal - actualTotal).toFixed(2);
  };

  // 计算分类汇总
  const getCategorySummary = useMemo(() => {
    // 计算单个商品的小计数量（与ProductListSection中的逻辑一致）
    const calculateSubtotalQuantity = (item: OrderItem): number => {
      const isProvider = tenantType?.toLowerCase() === "provider";
      const isMarket = tenantType?.toLowerCase() === "market";
      const isCustomer = tenantType?.toLowerCase() === "customer";
      
      // 获取市场接收和客户接收数量
      let marketReceivedQtyForDisplay = "";
      let customerReceivedQtyForDisplay = "";
      
      if (roundGroups && roundGroups.length > 0) {
        // 有轮数分组数据，从最新轮中获取
        const latestGroup = roundGroups[roundGroups.length - 1];
        if (isProvider || isMarket) {
          marketReceivedQtyForDisplay = getInspectedQuantityForDisplay(item.id, "MARKET", inspections);
          customerReceivedQtyForDisplay = getInspectedQuantityForDisplay(item.id, "CUSTOMER", inspections);
        } else {
          marketReceivedQtyForDisplay = getReceivedQuantityFromRound(item.id, "MARKET", latestGroup.inspections);
          customerReceivedQtyForDisplay = getReceivedQuantityFromRound(item.id, "CUSTOMER", latestGroup.inspections);
        }
      } else {
        // 没有轮数分组数据
        if (isProvider || isMarket) {
          marketReceivedQtyForDisplay = getInspectedQuantityForDisplay(item.id, "MARKET", inspections);
          customerReceivedQtyForDisplay = getInspectedQuantityForDisplay(item.id, "CUSTOMER", inspections);
        } else if (inspections.length > 0) {
          marketReceivedQtyForDisplay = getReceivedQuantityFromRound(item.id, "MARKET", inspections);
          customerReceivedQtyForDisplay = getReceivedQuantityFromRound(item.id, "CUSTOMER", inspections);
        }
      }
      
      // 获取发货数量
      let deliveredQty = 0;
      if (isEditing && (item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity) {
        deliveredQty = parseFloat((item as OrderItem & { deliveredQuantity?: string }).deliveredQuantity || "0");
      } else {
        if (roundGroups && roundGroups.length > 0) {
          const latestGroup = roundGroups[roundGroups.length - 1];
          if (isCustomer) {
            deliveredQty = parseFloat(getReceivedQuantityFromRound(item.id, "MARKET", latestGroup.inspections)) || 0;
          } else {
            deliveredQty = parseFloat(getDeliveredQuantityFromRound(item.id, latestGroup.deliveries)) || 0;
          }
        } else {
          if (isCustomer && inspections.length > 0) {
            deliveredQty = parseFloat(getReceivedQuantityFromRound(item.id, "MARKET", inspections)) || 0;
          } else {
            deliveredQty = 0;
          }
        }
      }
      
      // 小计计算：优先用客户接收，如果客户接收没有，则用市场接收，如果市场接收没有，则用发货数量，如果发货数量没有，则用下单数量
      const customerReceivedQtyValue = customerReceivedQtyForDisplay ? parseFloat(customerReceivedQtyForDisplay) : 0;
      const marketReceivedQtyValue = marketReceivedQtyForDisplay ? parseFloat(marketReceivedQtyForDisplay) : 0;
      const orderedQtyValue = parseFloat(item.orderedQty) || 0;
      
      const subtotalQuantity = customerReceivedQtyValue > 0 
        ? customerReceivedQtyValue
        : (marketReceivedQtyValue > 0 
          ? marketReceivedQtyValue 
          : (deliveredQty > 0 
            ? deliveredQty 
            : orderedQtyValue));
      
      return subtotalQuantity;
    };

    // 构建退货商品ID集合
    const returnedItemIds = new Set<number>();
    returnExchangeRecords.forEach(record => {
      if (record.operationType === 'RETURN') {
        returnedItemIds.add(record.id);
      }
    });

    const summary: Record<string, { count: number; total: number }> = {};
    
    orderItems.forEach(item => {
      // 跳过退货商品
      if (returnedItemIds.has(item.id)) {
        return;
      }

      if (!summary[item.category]) {
        summary[item.category] = { count: 0, total: 0 };
      }

      // 使用商品清单的小计计算逻辑
      const subtotalQuantity = calculateSubtotalQuantity(item);
      const subtotal = parseFloat(item.discountedUnitPrice) * subtotalQuantity;
      
      summary[item.category].count += 1;
      summary[item.category].total += subtotal;
    });

    return Object.entries(summary).map(([category, data]) => ({
      category,
      count: data.count,
      total: data.total.toFixed(2)
    }));
  }, [orderItems, inspections, roundGroups, tenantType, isEditing, returnExchangeRecords]);

  const actualTotal = useMemo(() => calculateActualTotal(orderItems), [orderItems]);
  const originalTotal = useMemo(() => calculateOriginalTotal(orderItems), [orderItems]);
  const discountTotal = useMemo(() => calculateDiscountTotal(parseFloat(originalTotal), parseFloat(actualTotal)), [originalTotal, actualTotal]);

  return {
    returnMoney,
    shouldDisplayReturnMoney,
    actualTotal,
    originalTotal,
    discountTotal,
    calculateActualTotal,
    calculateOriginalTotal,
    calculateDiscountTotal,
    getCategorySummary,
  };
}
