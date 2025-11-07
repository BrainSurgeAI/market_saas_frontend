import { useEffect, useState, useCallback } from 'react';
import type { ExchangeItem, ExchangeItemStatus } from '@/lib/types/orderStatus';
import { ExchangeItemStatus, TenantType } from '@/lib/types/orderStatus';

interface UseExchangeItemsOptions {
  orderCode: string;
  tenantType: string;
  enabled?: boolean;
  useMockData?: boolean; // 新增：是否使用模拟数据
}

interface ExchangeItemWithInputState extends ExchangeItem {
  inputQuantity?: string;
  submitting?: boolean;
  submitError?: string | null;
}

// 模拟数据
const MOCK_EXCHANGE_ITEMS: ExchangeItem[] = [
  {
    id: 1,
    returnExchangeId: 101,
    productCode: 'SKU-001',
    productName: '澳洲谷饲牛腱',
    quantity: 10,
    price: 89.99,
    totalAmount: 899.90,
    status: ExchangeItemStatus.PENDING,
    shippedAt: null,
    receivedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    returnExchangeId: 102,
    productCode: 'SKU-002',
    productName: '智利三文鱼整切',
    quantity: 6,
    price: 128.50,
    totalAmount: 771.00,
    status: ExchangeItemStatus.SHIPPED,
    shippedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
    receivedAt: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1天前
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    returnExchangeId: 103,
    productCode: 'SKU-003',
    productName: '新西兰羊排',
    quantity: 8,
    price: 98.00,
    totalAmount: 784.00,
    status: ExchangeItemStatus.RECEIVED,
    shippedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2天前
    receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1天前
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3天前
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    returnExchangeId: 104,
    productCode: 'SKU-004',
    productName: '挪威冰鲜鳕鱼',
    quantity: 5,
    price: 156.00,
    totalAmount: 780.00,
    status: ExchangeItemStatus.COMPLETED,
    shippedAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(), // 4天前
    receivedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2天前
    createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(), // 5天前
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    returnExchangeId: 105,
    productCode: 'SKU-005',
    productName: '日本和牛A5',
    quantity: 3,
    price: 388.00,
    totalAmount: 1164.00,
    status: ExchangeItemStatus.REJECTED,
    shippedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12小时前
    receivedAt: null,
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5天前
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6小时前
  },
];

export function useExchangeItems({
  orderCode,
  tenantType,
  enabled = true,
  useMockData = true, // 默认使用模拟数据
}: UseExchangeItemsOptions) {
  const [exchangeItems, setExchangeItems] = useState<ExchangeItemWithInputState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取换货商品列表
  const fetchExchangeItems = useCallback(async () => {
    if (!enabled || !orderCode) return;

    try {
      setLoading(true);
      setError(null);

      // 模拟数据模式
      if (useMockData) {
        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        setExchangeItems(
          MOCK_EXCHANGE_ITEMS.map((item: ExchangeItem) => ({
            ...item,
            inputQuantity: item.quantity.toString(),
            submitting: false,
            submitError: null,
          }))
        );
        setLoading(false);
        return;
      }

      // 真实 API 调用
      const response = await fetch(`/api/orders/${orderCode}/exchange-items`);
      if (!response.ok) {
        throw new Error(`获取换货商品失败: ${response.status}`);
      }

      const result = await response.json();
      setExchangeItems(
        (result?.data ?? []).map((item: ExchangeItem) => ({
          ...item,
          inputQuantity: item.quantity.toString(),
          submitting: false,
          submitError: null,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取换货商品时出错');
    } finally {
      setLoading(false);
    }
  }, [orderCode, enabled, useMockData]);

  useEffect(() => {
    fetchExchangeItems();
  }, [fetchExchangeItems]);

  // 更新换货商品状态
  const updateExchangeItemStatus = useCallback(
    async (
      itemId: number,
      newStatus: ExchangeItemStatus,
      reason?: string
    ) => {
      try {
        // 模拟数据模式
        if (useMockData) {
          // 模拟网络延迟
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // 更新本地状态
          setExchangeItems((prev) =>
            prev.map((item) => {
              if (item.id === itemId) {
                const updates: Partial<ExchangeItem> = {
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                };

                // 根据新状态更新时间戳
                if (newStatus === ExchangeItemStatus.SHIPPED) {
                  updates.shippedAt = new Date().toISOString();
                } else if (newStatus === ExchangeItemStatus.RECEIVED) {
                  updates.receivedAt = new Date().toISOString();
                }

                return { ...item, ...updates };
              }
              return item;
            })
          );

          console.log(`[Mock] 商品 ${itemId} 状态已更新为 ${newStatus}`, { reason });
          return { id: itemId, status: newStatus };
        }

        // 真实 API 调用
        const response = await fetch(
          `/api/orders/${orderCode}/exchange-items/${itemId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: newStatus,
              reason,
              updatedBy: tenantType,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`更新换货商品状态失败: ${response.status}`);
        }

        const updated = await response.json();
        setExchangeItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, ...updated.data } : item))
        );

        return updated.data;
      } catch (err) {
        throw err;
      }
    },
    [orderCode, tenantType, useMockData]
  );

  // 获取可执行的操作（基于角色和状态）
  const getAvailableActions = useCallback(
    (item: ExchangeItem) => {
      const tenant = tenantType.toLowerCase();
      const status = item.status;
      const actions: string[] = [];

      // Provider: 可以发货（从PENDING变为SHIPPED）
      if (tenant === TenantType.PROVIDER) {
        if (status === ExchangeItemStatus.PENDING) {
          actions.push('ship');
        }
      }

      // Market: 可以收货、拒收（从SHIPPED变为RECEIVED或REJECTED）
      if (tenant === TenantType.MARKET) {
        if (status === ExchangeItemStatus.SHIPPED) {
          actions.push('receive', 'reject');
        }
        if (status === ExchangeItemStatus.RECEIVED) {
          actions.push('complete');
        }
      }

      // Customer: 可以确认完成（从RECEIVED变为COMPLETED）
      if (tenant === TenantType.CUSTOMER) {
        if (status === ExchangeItemStatus.RECEIVED) {
          actions.push('confirm');
        }
      }

      return actions;
    },
    [tenantType]
  );

  // 检查是否可以执行特定操作
  const canPerformAction = useCallback(
    (item: ExchangeItem, action: string) => {
      return getAvailableActions(item).includes(action);
    },
    [getAvailableActions]
  );

  // 获取状态的中文描述
  const getStatusLabel = useCallback((status: ExchangeItemStatus) => {
    const labels: Record<ExchangeItemStatus, string> = {
      [ExchangeItemStatus.PENDING]: '待发货',
      [ExchangeItemStatus.SHIPPED]: '已发货',
      [ExchangeItemStatus.RECEIVED]: '已收货',
      [ExchangeItemStatus.REJECTED]: '已拒收',
      [ExchangeItemStatus.COMPLETED]: '已完成',
    };
    return labels[status] || status;
  }, []);

  // 获取状态的样式变量
  const getStatusVariant = useCallback((status: ExchangeItemStatus) => {
    const variants: Record<ExchangeItemStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      [ExchangeItemStatus.PENDING]: 'secondary',
      [ExchangeItemStatus.SHIPPED]: 'default',
      [ExchangeItemStatus.RECEIVED]: 'default',
      [ExchangeItemStatus.REJECTED]: 'destructive',
      [ExchangeItemStatus.COMPLETED]: 'default',
    };
    return variants[status] || 'secondary';
  }, []);

  // 批量操作支持
  const updateMultipleItems = useCallback(
    async (itemIds: number[], newStatus: ExchangeItemStatus) => {
      try {
        // 模拟数据模式
        if (useMockData) {
          // 模拟网络延迟
          await new Promise((resolve) => setTimeout(resolve, 1200));

          // 更新本地状态
          setExchangeItems((prev) =>
            prev.map((item) => {
              if (itemIds.includes(item.id)) {
                const updates: Partial<ExchangeItem> = {
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                };

                if (newStatus === ExchangeItemStatus.SHIPPED) {
                  updates.shippedAt = new Date().toISOString();
                } else if (newStatus === ExchangeItemStatus.RECEIVED) {
                  updates.receivedAt = new Date().toISOString();
                }

                return { ...item, ...updates };
              }
              return item;
            })
          );

          console.log(`[Mock] 批量更新商品 ${itemIds.join(', ')} 状态为 ${newStatus}`);
          return itemIds.map((id) => ({ id, status: newStatus }));
        }

        // 真实 API 调用
        const response = await fetch(
          `/api/orders/${orderCode}/exchange-items/batch`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              itemIds,
              status: newStatus,
              updatedBy: tenantType,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`批量更新换货商品状态失败: ${response.status}`);
        }

        const updated = await response.json();
        setExchangeItems((prev) =>
          prev.map((item) =>
            itemIds.includes(item.id) ? { ...item, status: newStatus } : item
          )
        );

        return updated.data;
      } catch (err) {
        throw err;
      }
    },
    [orderCode, tenantType, useMockData]
  );

  return {
    exchangeItems,
    loading,
    error,
    fetchExchangeItems,
    updateExchangeItemStatus,
    getAvailableActions,
    canPerformAction,
    getStatusLabel,
    getStatusVariant,
    updateMultipleItems,
  };
}
