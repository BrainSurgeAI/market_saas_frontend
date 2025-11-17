import { useState, useEffect } from 'react';
import { Order, OrderItem, ApiResponse, ReturnExchangeItem, OperationType, OrderInspection, Delivery, StatusHistoryItem, Receipt, ReceiptItem, OrderDetailData } from '@/lib/types/orderStatus';
import { shouldEnterEditMode } from '@/lib/utils/orderStatusUtils';

export function useOrderDetails(orderCode: string, orgId: string, tenantType: string) {
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [returnExchangeRecords, setReturnExchangeRecords] = useState<ReturnExchangeItem[]>([]);
  const [rawReceipts, setRawReceipts] = useState<Receipt[]>([]);
  const [inspections, setInspections] = useState<OrderInspection[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 将 API 返回的操作记录转换为组件内部使用的格式
  const convertApiReceiptToInternalFormat = (
    receipt: Receipt,
    receiptItem: ReceiptItem,
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

        const jsonResponse = await response.json();
        
        // 调试：打印API响应
        console.log('API响应:', jsonResponse);
        
        // API路由可能返回两种格式：
        // 1. 完整格式：{ code: 200, message: "success", data: {...} }
        // 2. 直接格式：{ order: {...}, items: [...], ... } (API路由已经解包了data)
        let responseData: OrderDetailData;
        
        if ('code' in jsonResponse && 'data' in jsonResponse) {
          // 完整格式
          const apiResponse = jsonResponse as ApiResponse;
          const responseCode = typeof apiResponse.code === 'string' ? parseInt(apiResponse.code, 10) : apiResponse.code;
          if (isNaN(responseCode) || responseCode !== 200) {
            console.error('API响应code不是200:', responseCode, '完整响应:', apiResponse);
            throw new Error(apiResponse.message || '获取订单详情失败');
          }
          if (!apiResponse.data) {
            throw new Error('API响应中缺少data字段');
          }
          responseData = apiResponse.data;
        } else if ('order' in jsonResponse && 'items' in jsonResponse) {
          // 直接格式（API路由已经解包了data）
          responseData = jsonResponse as OrderDetailData;
        } else {
          console.error('无法识别的API响应格式:', jsonResponse);
          throw new Error('API响应格式不正确');
        }
        
        // 处理订单详情，映射字段名
        const orderDetailData: Order = {
          ...responseData.order,
          orderCode: orderCode,
          customerName: responseData.order.customerName || '',
          contactName: responseData.order.contactName || responseData.order.receiverName || '',
          contactPhone: responseData.order.contactPhone || responseData.order.receiverPhone || '',
          deliveryStaffName: responseData.order.deliveryStaffName || responseData.order.shipperName || null,
          deliveryStaffPhone: responseData.order.deliveryStaffPhone || responseData.order.shipperPhone || null,
        };
        
        setOrderDetail(orderDetailData);
        setOrderItems(responseData.items || []);
        
        // 保存原始的 receipts 数据
        setRawReceipts(responseData.receipts || []);
        setInspections(responseData.inspections || []);
        setDeliveries(responseData.deliveries || []);
        setStatusHistory(responseData.statusHistory || []);

        const productIdToItemId = new Map((responseData.items || []).map(item => [item.productId, item.id] as const));

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
              return true;
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
        const errorMessage = err instanceof Error ? err.message : '获取订单详情时出错';
        console.error('获取订单详情失败:', err);
        console.error('错误详情:', {
          orderCode,
          orgId,
          tenantType,
          error: err instanceof Error ? {
            message: err.message,
            stack: err.stack,
            name: err.name
          } : err
        });
        setError(errorMessage);
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
    setInspections,
    deliveries,
    setDeliveries,
    statusHistory,
    loading,
    error,
    isEditing,
    setIsEditing,
  };
}
