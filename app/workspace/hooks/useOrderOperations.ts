import { useState } from 'react';
import { OrderItem, ReturnExchangeItem, OperationType } from '@/lib/types/orderStatus';
import { useToast } from '@/hooks/use-toast';
import { OrderDetail } from '@/lib/types/orderStatus';

export function useOrderOperations(
  orderCode: string,
  orderItems: OrderItem[],
  setOrderItems: (items: OrderItem[]) => void,
  returnExchangeRecords: ReturnExchangeItem[],
  setReturnExchangeRecords: (records: ReturnExchangeItem[]) => void,
  user: any,
  orderStatus?: string,
  tenantType?: string
) {
  const { toast } = useToast();
  
  const [operatingProductId, setOperatingProductId] = useState<number>(0);
  const [operationType, setOperationType] = useState<OperationType | null>(null);
  const [operatingQuantity, setOperatingQuantity] = useState<string>('0');
  const [operatingReason, setOperatingReason] = useState<string>('');
  const [useFullQuantity, setUseFullQuantity] = useState<boolean>(false);
  const [quantityError, setQuantityError] = useState<string>('');
  const [reasonError, setReasonError] = useState<string>('');
  const [showOperationDialog, setShowOperationDialog] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  // 验证退换货数量
  const validateQuantity = (value: string, id: number): boolean => {
    const numValue = parseFloat(value);
    const item = orderItems.find(item => item.id === id);

    if (!item) {
      setQuantityError('商品不存在');
      return false;
    }

    if (isNaN(numValue)) {
      setQuantityError('请输入有效数字');
      return false;
    }

    if (numValue <= 0) {
      setQuantityError('数量必须大于0');
      return false;
    }

    const maxQuantity = parseFloat(item.deliveredQuantity || '0');
    if (numValue > maxQuantity) {
      setQuantityError(`数量不能超过实际数量 ${maxQuantity}`);
      return false;
    }

    if (value.includes('.') && value.split('.')[1].length > 2) {
      setQuantityError('最多支持2位小数');
      return false;
    }

    setQuantityError('');
    return true;
  };

  // 处理数量变更
  const handleQuantityChange = (value: string) => {
    setOperatingQuantity(value);
    validateQuantity(value, operatingProductId);
  };

  // 验证原因
  const validateReason = (value: string): boolean => {
    if (operationType === 'SIGN') {
      setReasonError('');
      return true;
    }

    if (value.length < 6) {
      setReasonError('原因描述不能少于6个字符');
      return false;
    }

    if (value.length > 255) {
      setReasonError('原因描述不能超过255个字符');
      return false;
    }

    setReasonError('');
    return true;
  };

  // 处理原因变更
  const handleReasonChange = (value: string) => {
    setOperatingReason(value);
    validateReason(value);
  };

  // 处理使用全部数量
  const handleUseFullQuantity = (checked: boolean) => {
    setUseFullQuantity(checked);

    if (checked) {
      const item = orderItems.find(item => item.id === operatingProductId);
      if (item) {
        setOperatingQuantity(item.deliveredQuantity || '0');
        setQuantityError('');
      }
    }
  };

  // 处理退货/换货操作
  const handleOperation = (id: number, type: OperationType) => {
    const item = orderItems.find(item => item.id === id);
    if (!item) return;

    setOperatingProductId(id);
    setOperationType(type);
    setOperatingQuantity('0');
    setOperatingReason('');
    setUseFullQuantity(false);
    setQuantityError('');
    setReasonError('');

    if (type === 'SIGN') {
      // 在 MARKET_INSPECTING 和 CUSTOMER_INSPECTING 状态下，签收操作需要显示对话框让用户输入数量
      const shouldShowDialog = orderStatus === 'MARKET_INSPECTING' || orderStatus === 'CUSTOMER_INSPECTING';
      if (shouldShowDialog) {
        setOperatingQuantity(item.deliveredQuantity || '0');
        setTimeout(() => {
          setShowOperationDialog(true);
        }, 0);
      } else {
        setOperatingQuantity(item.deliveredQuantity || '0');
        setTimeout(() => {
          setShowConfirmDialog(true);
        }, 0);
      }
    } else {
      setTimeout(() => {
        setShowOperationDialog(true);
      }, 0);
    }
  };

  // 处理提交
  const handleSubmitOperation = () => {
    const isQuantityValid = validateQuantity(operatingQuantity, operatingProductId);
    const isReasonValid = operationType === 'SIGN' ? true : validateReason(operatingReason);

    if (!isQuantityValid || !isReasonValid || !operationType) {
      return;
    }

    setShowConfirmDialog(true);
  };

  // 处理确认操作
  const handleConfirmOperation = (orderDetail: OrderDetail) => {
    const item = orderItems.find(item => item.id === operatingProductId);
    if (!item || !operationType || !orderDetail) return;

    // 计算实际提交的数量
    let actualQuantity = parseFloat(operatingQuantity);
    if (operationType === 'EXCHANGE') {
      // 换货操作：计算换货数量 = 客户需求量 - (实际到货量 - 坏货数量)
      const customerQuantity = parseFloat(item.orderedQty || '0');
      const actualDeliveryQuantity = parseFloat(item.deliveredQuantity || '0');
      const damagedQuantity = parseFloat(operatingQuantity || '0');
      actualQuantity = Math.max(0, customerQuantity - (actualDeliveryQuantity - damagedQuantity));
    }

    const operationRecord: ReturnExchangeItem = {
      orderId: orderCode,
      id: item.id,
      productId: item.productId,
      productName: item.name,
      operationType: operationType,
      quantity: actualQuantity,
      reason: operatingReason || (operationType === 'SIGN' ? '签收' : ''),
      unit: item.unit
    };


    // 提交到服务器（等待响应）
    submitOperationToServer(operationRecord).then((success) => {
      if (success) {
        // ✅ 只有服务器返回成功，才更新本地状态
        // 从 sessionStorage 获取现有记录
        const existingRecordsString = sessionStorage.getItem('returnExchangeItems');
        let records: ReturnExchangeItem[] = [];
        if (existingRecordsString) {
          try {
            const parsedRecords = JSON.parse(existingRecordsString);
            // 验证数据格式
            if (Array.isArray(parsedRecords)) {
              records = parsedRecords.filter(record =>
                record &&
                typeof record.id === 'number' &&
                typeof record.operationType === 'string' &&
                ['SIGN', 'RETURN', 'EXCHANGE'].includes(record.operationType)
              );
            }
          } catch (e) {
            console.error('解析 sessionStorage 数据出错', e);
            records = [];
          }
        }

        // 移除同一商品的已有记录，然后添加新的记录
        records = records.filter(record => !(record.orderId === orderCode && record.id === operatingProductId));
        records.push(operationRecord);

        // 保存到 sessionStorage
        sessionStorage.setItem('returnExchangeItems', JSON.stringify(records));

        // 更新本地状态中的退换货记录（仅限当前订单）
        const currentOrderRecords = records.filter(record => record.orderId === orderCode);
        setReturnExchangeRecords(currentOrderRecords);

        // 更新 orderItems 中的相关字段
        const updatedOrderItems = orderItems.map(orderItem => {
          if (orderItem.id === operatingProductId) {
            if (operationType === 'SIGN') {
              // 签收操作：根据租户类型和订单状态更新相应的字段
              const updatedItem: any = {
                ...orderItem,
                acceptedQuantity: operatingQuantity
              };
              
              // MARKET租户在MARKET_INSPECTING状态下，更新marketInspectedQuantity
              if (tenantType?.toLowerCase() === 'market' && orderStatus === 'MARKET_INSPECTING') {
                updatedItem.marketInspectedQuantity = operatingQuantity;
              }
              
              // CUSTOMER租户在CUSTOMER_INSPECTING状态下，更新customerInspectedQuantity
              if (tenantType?.toLowerCase() === 'customer' && orderStatus === 'CUSTOMER_INSPECTING') {
                updatedItem.customerInspectedQuantity = operatingQuantity;
              }
              
              return updatedItem;
            } else if (operationType === 'EXCHANGE') {
              // 换货操作：更新商品的实际数量：实际供货量 - 坏货量
              const damagedQuantity = parseFloat(operatingQuantity || '0');
              const currentDeliveredQuantity = parseFloat(orderItem.deliveredQuantity || '0');
              const newDeliveredQuantity = Math.max(0, currentDeliveredQuantity - damagedQuantity);
              return {
                ...orderItem,
                deliveredQuantity: newDeliveredQuantity.toString()
              };
            }
          }
          return orderItem;
        });
        setOrderItems(updatedOrderItems);

        toast({
          title: '操作成功',
          description: operationType === 'SIGN' ? '商品签收记录已保存' :
            records.length > 1 && records.some(r => r.orderId === orderCode && r.id === operatingProductId && r !== operationRecord)
              ? `${operationType === 'RETURN' ? '退货' : '换货'}记录已更新（覆盖之前的记录）`
              : `${operationType === 'RETURN' ? '退货' : '换货'}记录已保存`,
          variant: 'default',
        });

        setShowConfirmDialog(false);

        setTimeout(() => {
          setShowOperationDialog(false);
        }, 100);
      }
    });
  };

  // 提交操作到服务器
  const submitOperationToServer = async (operationRecord: ReturnExchangeItem): Promise<boolean> => {
    try {
      // 调用后端 API /api/v1/orders/{order_code}/inspect-sub-orders
      const response = await fetch(`/api/orders/${orderCode}/inspect-sub-orders`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operateBy: user?.name || '',
          receipt: operationRecord,
        }),
      });

      if (!response.ok) {
        throw new Error(`提交操作记录失败: ${response.status}`);
      }

      // 调试日志 - 只在开发环境启用
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] Successfully submitted operation for item ${operationRecord.id}:`, operationRecord);
      }

      return true; // 表示提交成功
    } catch (error) {
      console.error('提交操作记录到服务器时出错:', error);
      toast({
        title: '同步失败',
        description: '操作记录已保存在本地，但未能同步到服务器',
        variant: 'destructive',
        duration: 5000,
      });
      return false; // 表示提交失败
    }
  };

  // 获取商品的退换货记录
  const getItemReturnExchangeRecords = (id: number) => {
    const targetItem = orderItems.find(item => item.id === id);
    return returnExchangeRecords.filter(record => {
      if (record.id === id) {
        return true;
      }
      if (!targetItem) {
        return false;
      }
      return record.productId === targetItem.productId;
    });
  };

  // 判断商品是否已签收
  const isProductSigned = (id: number) => {
    // 首先检查产品本身的状态，如果是 PENDING 等待状态，则不应该显示为已签收
    const item = orderItems.find(item => item.id === id);
    if (item && item.status && ['PENDING', 'ASSIGNED', 'PROCESSING'].includes(item.status)) {
      // 调试日志 - 只在开发环境启用
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEBUG] isProductSigned for item ${id}: false (item status is ${item.status})`);
      }
      return false;
    }

    const isSigned = returnExchangeRecords.some(
      record => record.id === id && record.operationType === 'SIGN'
    );

    // 调试日志 - 只在开发环境启用
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] isProductSigned for item ${id}:`, {
        isSigned,
        itemStatus: item?.status,
        allRecords: returnExchangeRecords,
        itemRecords: returnExchangeRecords.filter(r => r.id === id),
        signRecords: returnExchangeRecords.filter(r => r.id === id && r.operationType === 'SIGN')
      });
    }

    return isSigned;
  };

  // 获取商品的签收记录
  const getProductSignRecord = (id: number) => {
    return returnExchangeRecords.find(
      record => record.id === id && record.operationType === 'SIGN'
    );
  };

  // 判断商品是否已经有操作记录
  const hasProductOperation = (id: number) => {
    return returnExchangeRecords.some(
      record => record.id === id
    );
  };

  // 获取产品的实际状态（考虑产品本身的status字段和操作记录）
  const getProductActualStatus = (id: number) => {
    const item = orderItems.find(orderItem => orderItem.id === id);
    const rawStatus = item?.status?.toUpperCase() ?? 'PENDING';
    const statusAlias: Record<string, 'SIGN' | 'RETURN' | 'EXCHANGE' | undefined> = {
      SIGNED: 'SIGN',
      RETURNED: 'RETURN',
      EXCHANGED: 'EXCHANGE',
    };

		if (rawStatus === 'PENDING') {
			return 'PENDING';
		}

    const lockedStatuses = new Set(['SIGN', 'RETURN', 'EXCHANGE']);

    const itemRecords = getItemReturnExchangeRecords(id);
    if (itemRecords.some(record => record.operationType === OperationType.SIGN)) {
      return 'SIGN';
    }
    if (itemRecords.some(record => record.operationType === OperationType.RETURN)) {
      return 'RETURN';
    }
    if (itemRecords.some(record => record.operationType === OperationType.EXCHANGE)) {
      return 'EXCHANGE';
    }

    const mappedStatus = statusAlias[rawStatus] ?? rawStatus;
    if (lockedStatuses.has(mappedStatus)) {
      return mappedStatus;
    }

    return 'PENDING';
  };

  // 判断产品是否可以被编辑（基于实际状态）
  const canProductBeEdited = (id: number) => {
    const actualStatus = getProductActualStatus(id).toUpperCase();
    const lockedStatuses = new Set(['SIGN', 'EXCHANGED', 'RETURN']);
    return !lockedStatuses.has(actualStatus);
  };

  return {
    operatingProductId,
    setOperatingProductId,
    operationType,
    setOperationType,
    operatingQuantity,
    setOperatingQuantity,
    operatingReason,
    setOperatingReason,
    useFullQuantity,
    setUseFullQuantity,
    quantityError,
    setQuantityError,
    reasonError,
    setReasonError,
    showOperationDialog,
    setShowOperationDialog,
    showConfirmDialog,
    setShowConfirmDialog,
    handleOperation,
    handleQuantityChange,
    handleReasonChange,
    handleUseFullQuantity,
    handleSubmitOperation,
    handleConfirmOperation,
    getItemReturnExchangeRecords,
    isProductSigned,
    getProductSignRecord,
    hasProductOperation,
    getProductActualStatus,
    canProductBeEdited,
    validateQuantity,
    validateReason,
  };
}
