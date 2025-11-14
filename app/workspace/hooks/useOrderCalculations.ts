import { useMemo } from 'react';
import { OrderItem, ReturnExchangeItem } from '@/lib/types/orderStatus';

export function useOrderCalculations(
  orderItems: OrderItem[],
  returnExchangeRecords: ReturnExchangeItem[],
  isEditing: boolean
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
      const price = parseFloat(item.price);
      return sum + (quantity * price);
    }, 0).toFixed(2);
  };

  // 计算折扣总额
  const calculateDiscountTotal = (originalTotal: number, actualTotal: number) => {
    return Math.max(0, originalTotal - actualTotal).toFixed(2);
  };

  // 计算分类汇总
  const getCategorySummary = () => {
    const summary: Record<string, { count: number; total: number }> = {};

    // 需要 orderDetail，但从 Hook 参数中获取... 
    // 这里有一个设计问题，Hook 中没有 orderDetail
    // 我们需要改变方式或者让调用者传递
    
    orderItems.forEach(item => {
      if (!summary[item.category]) {
        summary[item.category] = { count: 0, total: 0 };
      }

      if (parseFloat(item.deliveredQuantity ?? '0') > 0) {
        summary[item.category].total += parseFloat(item.discountedUnitPrice) * parseFloat(item.deliveredQuantity);
      } else {
        summary[item.category].total += parseFloat(item.total);
      }
    });

    return Object.entries(summary).map(([category, data]) => ({
      category,
      count: data.count,
      total: data.total.toFixed(2)
    }));
  };

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
