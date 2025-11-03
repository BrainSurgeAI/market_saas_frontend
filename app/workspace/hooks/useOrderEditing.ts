import { useState, useMemo } from 'react';
import { OrderItem } from '@/lib/types/orderStatus';
import { useToast } from '@/hooks/use-toast';

export function useOrderEditing(orderItems: OrderItem[], setOrderItems: (items: OrderItem[]) => void) {
  const { toast } = useToast();
  
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});
  const [savingChanges, setSavingChanges] = useState(false);

  // 判断单位是否允许小数
  const isUnitAllowingDecimal = (unit: string): boolean => {
    if (!unit) return true;
    
    const decimalUnits = ['kg', 'g', 'mg', 'ml', 'l', '升', '毫升', '克', '千克', '斤'];
    const unitLower = unit.toLowerCase();
    
    return decimalUnits.some(decimalUnit => unitLower.includes(decimalUnit.toLowerCase()));
  };

  // 处理实际数量变更
  const handleActualQuantityChange = (id: number, value: string) => {
    const item = orderItems.find(item => item.id === id);
    if (!item) return;

    const newErrors = { ...itemErrors };
    delete newErrors[id];

    const allowDecimal = isUnitAllowingDecimal(item.unit);
    const numericValue = parseFloat(value);
    
    if (!allowDecimal && value.includes('.')) {
      newErrors[id] = `${item.unit}单位只能输入整数`;
    } else if (isNaN(numericValue)) {
      newErrors[id] = '请输入数字';
    } else if (numericValue < 0) {
      newErrors[id] = '不能为负数';
    } else if (numericValue === 0) {
      newErrors[id] = '不能为0';
    } else if (numericValue > 999999.99) {
      newErrors[id] = '超出范围';
    } else if (allowDecimal && value.includes('.') && value.split('.')[1].length > 2) {
      newErrors[id] = '最多支持2位小数';
    }

    setItemErrors(newErrors);

    const updatedItems = orderItems.map(item => {
      if (item.id === id) {
        const actualQuantity = value;
        const actualPrice = parseFloat(item.actualPrice);

        const actualTotal = (actualQuantity && !isNaN(parseFloat(actualQuantity)) && !isNaN(actualPrice))
          ? (parseFloat(actualQuantity) * actualPrice).toFixed(2)
          : item.total;

        return {
          ...item,
          actualQuantity,
          actualTotal
        };
      }
      return item;
    });

    setOrderItems(updatedItems);
  };

  // 处理输入框的 keydown 事件
  const handleActualQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemId: number) => {
    const item = orderItems.find(item => item.id === itemId);
    if (!item) return;

    const allowDecimal = isUnitAllowingDecimal(item.unit);
    
    if (!allowDecimal && (e.key === '.' || e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
    }
  };

  // 验证是否有错误
  const hasErrors = (): boolean => {
    if (Object.keys(itemErrors).length > 0) {
      return true;
    }

    for (const item of orderItems) {
      const quantity = parseFloat(item.actualQuantity);
      if (isNaN(quantity) || quantity === 0) {
        const newErrors = { ...itemErrors };
        newErrors[item.id] = quantity === 0 ? '数量不能为0' : '请输入数字';
        setItemErrors(newErrors);
        return true;
      }
    }

    return false;
  };

  // 清空错误
  const clearErrors = () => {
    setItemErrors({});
  };

  return {
    itemErrors,
    setItemErrors,
    savingChanges,
    setSavingChanges,
    handleActualQuantityChange,
    handleActualQuantityKeyDown,
    isUnitAllowingDecimal,
    hasErrors,
    clearErrors,
  };
}
