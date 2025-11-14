import { useState, useEffect } from 'react';
import { OrderDetail, OrderItem, ApiResponse, ReturnExchangeItem, OperationType, OrderInspection } from '@/lib/types/orderStatus';
import { shouldEnterEditMode } from '@/lib/utils/orderStatusUtils';

export function useOrderDetails(orderCode: string, orgId: string, tenantType: string) {
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [returnExchangeRecords, setReturnExchangeRecords] = useState<ReturnExchangeItem[]>([]);
  const [rawReceipts, setRawReceipts] = useState<ApiResponse['receipts']>([]);
  const [inspections, setInspections] = useState<OrderInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 将 API 返回的操作记录转换为组件内部使用的格式
  const convertApiReceiptToInternalFormat = (
    receipt: ApiResponse['receipts'][0],
    receiptItem: ApiResponse['receipts'][0]['items'][0],
    itemId: number,
    orderCode: string
  ): ReturnExchangeItem => ({
    orderId: orderCode,
    id: itemId,
    productId: receiptItem.productId,
    productName: receiptItem.productName,
    operationType: receipt.operationType as OperationType,
    quantity: parseFloat(receiptItem.quantity),
    reason: receiptItem.reason,
    unit: receiptItem.unit
  });

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/orders/${orderCode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`请求失败: ${response.status}`);
        }

        const responseData: ApiResponse = await response.json();
        
        // 处理订单详情，映射字段名
        const orderDetailData: OrderDetail = {
          ...responseData.order,
          orderCode: responseData.order.orderCode || orderCode,
          customerName: responseData.order.customerName || '',
          contactName: responseData.order.contactName || responseData.order.receiverName || '',
          contactPhone: responseData.order.contactPhone || responseData.order.receiverPhone || '',
          deliveryStaffName: responseData.order.deliveryStaffName || responseData.order.shipperName || null,
          deliveryStaffPhone: responseData.order.deliveryStaffPhone || responseData.order.shipperPhone || null,
        };
        
        setOrderDetail(orderDetailData);
        setOrderItems(responseData.items);
        
        // 保存原始的 receipts 数据
        setRawReceipts(responseData.receipts || []);
        setInspections(responseData.inspections || []);

        const productIdToItemId = new Map(responseData.items.map(item => [item.productId, item.id] as const));

        // 处理操作记录
        let allReceipts: ReturnExchangeItem[] = [];

        // 处理 API 返回的 receipts（新格式：每个 receipt 包含多个 items）
        if (responseData.receipts && Array.isArray(responseData.receipts)) {
          responseData.receipts.forEach(receipt => {
            if (receipt.items && Array.isArray(receipt.items)) {
              receipt.items.forEach(receiptItem => {
                const itemId = productIdToItemId.get(receiptItem.productId);
                if (itemId !== undefined) {
                  const formattedReceipt = convertApiReceiptToInternalFormat(
                    receipt,
                    receiptItem,
                    itemId,
                    orderCode
                  );
                  allReceipts.push(formattedReceipt);
                }
              });
            }
          });
        }

        // 从 sessionStorage 读取本地保存的操作记录
        try {
          const existingRecordsString = sessionStorage.getItem('returnExchangeItems');
          if (existingRecordsString) {
            const localRecords: ReturnExchangeItem[] = JSON.parse(existingRecordsString);
            // 只合并当前订单的本地记录，且不与 API 返回的记录重复
            const currentOrderLocalRecords = localRecords.filter(record =>
              record.orderId === orderCode &&
              !allReceipts.some(apiReceipt =>
                apiReceipt.id === record.id &&
                apiReceipt.operationType === record.operationType &&
                apiReceipt.productId === record.productId
              )
            );
            const sanitizedLocalRecords = currentOrderLocalRecords.filter(record => {
              const matchedItem = responseData.items.find(item => item.id === record.id || item.productId === record.productId);
              if (!matchedItem) {
                return false;
              }
              const itemStatus = matchedItem.status?.toUpperCase() ?? 'PENDING';
              if (['SIGN', 'SIGNED'].includes(itemStatus) && record.operationType === 'SIGN') {
                return true;
              }
              if (['RETURN', 'RETURNED'].includes(itemStatus) && record.operationType === 'RETURN') {
                return true;
              }
              if (['EXCHANGE', 'EXCHANGED'].includes(itemStatus) && record.operationType === 'EXCHANGE') {
                return true;
              }
              return false;
            });

            allReceipts = [...allReceipts, ...sanitizedLocalRecords];

            const otherOrderRecords = localRecords.filter(record => record.orderId !== orderCode);
            sessionStorage.setItem('returnExchangeItems', JSON.stringify([...otherOrderRecords, ...allReceipts]));
          }
        } catch (e) {
          console.error('读取本地操作记录出错:', e);
        }

        setReturnExchangeRecords(allReceipts);

        // 根据订单状态和租户类型决定是否进入编辑模式
        if (shouldEnterEditMode(orderDetailData.orderStatus, tenantType)) {
          setIsEditing(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取订单详情时出错');
      } finally {
        setLoading(false);
      }
    };

    if (orderCode) {
      fetchOrderDetail();
    }
  }, [orderCode, orgId, tenantType]);

  return {
    orderDetail,
    setOrderDetail,
    orderItems,
    setOrderItems,
    returnExchangeRecords,
    setReturnExchangeRecords,
    rawReceipts,
    inspections,
    loading,
    error,
    isEditing,
    setIsEditing,
  };
}
