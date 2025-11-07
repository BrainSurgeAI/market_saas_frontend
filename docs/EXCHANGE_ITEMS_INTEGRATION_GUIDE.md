# Exchange Items 前端集成指南

## 目录
1. [概述](#概述)
2. [类型定义](#类型定义)
3. [Hook 使用](#hook-使用)
4. [组件使用](#组件使用)
5. [完整示例](#完整示例)
6. [状态管理](#状态管理)
7. [错误处理](#错误处理)
8. [测试指南](#测试指南)

---

## 概述

Exchange Items 集成包括：
- **类型系统**: `ExchangeItem`, `ExchangeItemStatus` 等
- **Hook**: `useExchangeItems` 用于数据获取和管理
- **组件**: `ExchangeItemsTable` 可复用的表格组件
- **API**: `/api/orders/:code/exchange-items` 系列接口

---

## 类型定义

### `ExchangeItem` 接口

```typescript
interface ExchangeItem {
  id: number;                    // 商品ID
  returnExchangeId: number;      // 关联的退换货记录ID
  productCode: string;           // 产品编号 (SKU)
  productName: string;           // 产品名称
  quantity: number;              // 换货数量
  price: number;                 // 单价
  totalAmount: number;           // 总金额 (quantity * price)
  status: ExchangeItemStatus;    // 当前状态
  shippedAt: string | null;      // 发货时间戳
  receivedAt: string | null;     // 收货时间戳
  createdAt: string;             // 创建时间
  updatedAt: string;             // 最后更新时间
}
```

### `ExchangeItemStatus` 枚举

```typescript
enum ExchangeItemStatus {
  PENDING = 'PENDING',       // 待发货
  SHIPPED = 'SHIPPED',       // 已发货
  RECEIVED = 'RECEIVED',     // 已收货
  REJECTED = 'REJECTED',     // 已拒收
  COMPLETED = 'COMPLETED',   // 已完成
}
```

---

## Hook 使用

### 基础用法

```typescript
import { useExchangeItems } from '@/app/workspace/hooks/useExchangeItems';
import { ExchangeItemStatus } from '@/lib/types/orderStatus';

export function MyComponent() {
  const {
    exchangeItems,
    loading,
    error,
    updateExchangeItemStatus,
    getAvailableActions,
    canPerformAction,
    getStatusLabel,
    getStatusVariant,
  } = useExchangeItems({
    orderCode: 'ORDER-001',
    tenantType: 'market',
    enabled: true, // 控制是否立即加载
  });

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      {exchangeItems.map(item => (
        <div key={item.id}>
          <p>{item.productName}</p>
          <p>状态: {getStatusLabel(item.status)}</p>
          <p>可用操作: {getAvailableActions(item).join(', ')}</p>
        </div>
      ))}
    </div>
  );
}
```

### 执行操作

```typescript
const handleReceiveItem = async (itemId: number) => {
  try {
    const item = exchangeItems.find(i => i.id === itemId);
    if (!item || !canPerformAction(item, 'receive')) {
      toast({ title: '无法执行此操作' });
      return;
    }

    await updateExchangeItemStatus(
      itemId,
      ExchangeItemStatus.RECEIVED,
      '收货完成' // 可选说明
    );

    toast({
      title: '成功',
      description: '商品已确认收货',
      variant: 'success',
    });
  } catch (err) {
    toast({
      title: '失败',
      description: err instanceof Error ? err.message : '更新失败',
      variant: 'destructive',
    });
  }
};
```

### 批量操作

```typescript
const handleBatchReceive = async (itemIds: number[]) => {
  try {
    const result = await updateMultipleItems(
      itemIds,
      ExchangeItemStatus.RECEIVED
    );

    toast({
      title: '成功',
      description: `已批量更新 ${result.length} 件商品`,
    });
  } catch (err) {
    toast({
      title: '批量操作失败',
      description: err instanceof Error ? err.message : '请重试',
      variant: 'destructive',
    });
  }
};
```

---

## 组件使用

### `ExchangeItemsTable` 组件

#### 基础用法

```tsx
import { ExchangeItemsTable } from '@/app/workspace/components/orders/ExchangeItemsTable';

export function OrderExchangePage() {
  const {
    exchangeItems,
    loading,
    updateExchangeItemStatus,
    canPerformAction,
    getStatusLabel,
    getStatusVariant,
  } = useExchangeItems({
    orderCode: orderCode,
    tenantType: tenantType,
  });

  const handleStatusChange = async (
    itemId: number,
    newStatus: ExchangeItemStatus,
    reason?: string
  ) => {
    try {
      await updateExchangeItemStatus(itemId, newStatus, reason);
      toast({
        title: '成功',
        description: '状态已更新',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: '失败',
        description: error instanceof Error ? error.message : '更新失败',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>换货商品</CardTitle>
      </CardHeader>
      <CardContent>
        <ExchangeItemsTable
          items={exchangeItems}
          loading={loading}
          tenantType={tenantType}
          onStatusChange={handleStatusChange}
          canPerformAction={canPerformAction}
          getStatusLabel={getStatusLabel}
          getStatusVariant={getStatusVariant}
        />
      </CardContent>
    </Card>
  );
}
```

#### Props 说明

| Prop | 类型 | 必需 | 说明 |
|------|------|------|------|
| `items` | `ExchangeItem[]` | ✅ | 换货商品数组 |
| `loading` | `boolean` | ❌ | 加载状态 (默认: false) |
| `tenantType` | `string` | ✅ | 租户类型 (provider/market/customer) |
| `onStatusChange` | `(itemId, status, reason?) => Promise<void>` | ✅ | 状态变更回调 |
| `canPerformAction` | `(item, action) => boolean` | ✅ | 权限检查函数 |
| `getStatusLabel` | `(status) => string` | ✅ | 状态标签函数 |
| `getStatusVariant` | `(status) => variant` | ✅ | 状态样式函数 |

---

## 完整示例

### 在订单详情页中集成

```tsx
// app/workspace/components/orders/OrderDetails.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExchangeItemsTable } from "./ExchangeItemsTable";
import { useExchangeItems } from "@/app/workspace/hooks/useExchangeItems";
import { useToast } from "@/hooks/use-toast";
import type { ExchangeItemStatus } from "@/lib/types/orderStatus";
import { ExchangeItemStatus } from "@/lib/types/orderStatus";

interface OrderDetailsProps {
  orderCode: string;
  orgId: string;
  tenantType: string;
}

export default function OrderDetail({
  orderCode,
  orgId,
  tenantType,
}: OrderDetailsProps) {
  const { toast } = useToast();

  const {
    exchangeItems,
    loading,
    error,
    updateExchangeItemStatus,
    canPerformAction,
    getStatusLabel,
    getStatusVariant,
  } = useExchangeItems({
    orderCode,
    tenantType,
    enabled: true,
  });

  const handleExchangeItemStatusChange = async (
    itemId: number,
    newStatus: ExchangeItemStatus,
    reason?: string
  ) => {
    try {
      await updateExchangeItemStatus(itemId, newStatus, reason);

      toast({
        title: "成功",
        description: `商品状态已更新为 ${getStatusLabel(newStatus)}`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "更新失败",
        description:
          error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 其他订单信息卡片... */}

      {/* 换货商品卡片 */}
      {exchangeItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              换货商品 ({exchangeItems.length} 项)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-red-500">
                加载换货商品失败: {error}
              </div>
            ) : (
              <ExchangeItemsTable
                items={exchangeItems}
                loading={loading}
                tenantType={tenantType}
                onStatusChange={handleExchangeItemStatusChange}
                canPerformAction={canPerformAction}
                getStatusLabel={getStatusLabel}
                getStatusVariant={getStatusVariant}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## 状态管理

### 权限矩阵

#### Provider (供应商)
```typescript
const providerActions = {
  PENDING: ['ship'],        // 可以发货
  SHIPPED: [],              // 等待市场收货
  RECEIVED: [],             // 已完成
  REJECTED: ['ship'],       // 重新发货
  COMPLETED: [],            // 终态
};
```

#### Market (市场)
```typescript
const marketActions = {
  PENDING: [],              // 等待供应商发货
  SHIPPED: ['receive', 'reject'], // 可收货或拒收
  RECEIVED: ['complete'],   // 可完成处理
  REJECTED: [],             // 等待供应商重新发货
  COMPLETED: [],            // 终态
};
```

#### Customer (客户)
```typescript
const customerActions = {
  PENDING: [],              // 无操作权限
  SHIPPED: [],              // 无操作权限
  RECEIVED: ['confirm'],    // 可确认完成
  REJECTED: [],             // 无操作权限
  COMPLETED: [],            // 终态
};
```

### 状态流转验证

```typescript
function isValidTransition(
  currentStatus: ExchangeItemStatus,
  newStatus: ExchangeItemStatus,
  tenantType: string
): boolean {
  const tenant = tenantType.toLowerCase();

  // 不允许状态回退
  const statusPriority = {
    PENDING: 1,
    SHIPPED: 2,
    RECEIVED: 3,
    REJECTED: 2, // 特殊: 可以从SHIPPED变为REJECTED
    COMPLETED: 4,
  };

  // Provider 发货: PENDING -> SHIPPED 或 REJECTED -> PENDING
  if (tenant === 'provider') {
    return (
      (currentStatus === ExchangeItemStatus.PENDING &&
        newStatus === ExchangeItemStatus.SHIPPED) ||
      (currentStatus === ExchangeItemStatus.REJECTED &&
        newStatus === ExchangeItemStatus.PENDING)
    );
  }

  // Market 收货/拒收: SHIPPED -> RECEIVED/REJECTED, RECEIVED -> COMPLETED
  if (tenant === 'market') {
    return (
      (currentStatus === ExchangeItemStatus.SHIPPED &&
        (newStatus === ExchangeItemStatus.RECEIVED ||
          newStatus === ExchangeItemStatus.REJECTED)) ||
      (currentStatus === ExchangeItemStatus.RECEIVED &&
        newStatus === ExchangeItemStatus.COMPLETED)
    );
  }

  // Customer 确认完成: RECEIVED -> COMPLETED
  if (tenant === 'customer') {
    return (
      currentStatus === ExchangeItemStatus.RECEIVED &&
      newStatus === ExchangeItemStatus.COMPLETED
    );
  }

  return false;
}
```

---

## 错误处理

### 常见错误情况

```typescript
async function handleExchangeItemOperation() {
  try {
    await updateExchangeItemStatus(itemId, newStatus, reason);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';

    // 解析特定错误
    if (errorMessage.includes('Invalid status transition')) {
      toast({
        title: '无效的状态转换',
        description: '该操作在当前状态下不被允许',
        variant: 'destructive',
      });
    } else if (errorMessage.includes('not found')) {
      toast({
        title: '商品不存在',
        description: '无法找到指定的换货商品',
        variant: 'destructive',
      });
    } else if (errorMessage.includes('Permission')) {
      toast({
        title: '权限不足',
        description: '您没有权限执行此操作',
        variant: 'destructive',
      });
    } else {
      toast({
        title: '操作失败',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }
}
```

### 网络错误重试

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 只重试网络错误，不重试业务逻辑错误
      if (lastError.message.includes('Invalid status transition')) {
        throw lastError;
      }

      // 指数退避
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }

  throw lastError || new Error('Operation failed');
}

// 使用
await retryOperation(
  () => updateExchangeItemStatus(itemId, newStatus),
  3
);
```

---

## 测试指南

### 单元测试

```typescript
// app/workspace/hooks/__tests__/useExchangeItems.test.ts

import { renderHook, act, waitFor } from '@testing-library/react';
import { useExchangeItems } from '../useExchangeItems';
import { ExchangeItemStatus } from '@/lib/types/orderStatus';

describe('useExchangeItems', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch exchange items on mount', async () => {
    const mockItems = [
      {
        id: 1,
        returnExchangeId: 1,
        productCode: 'SKU001',
        productName: '商品1',
        quantity: 5,
        price: 99.99,
        totalAmount: 499.95,
        status: ExchangeItemStatus.PENDING,
        shippedAt: null,
        receivedAt: null,
        createdAt: '2024-11-04T00:00:00Z',
        updatedAt: '2024-11-04T00:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockItems }),
    });

    const { result } = renderHook(() =>
      useExchangeItems({
        orderCode: 'ORD001',
        tenantType: 'market',
      })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.exchangeItems).toEqual(mockItems);
  });

  it('should update exchange item status', async () => {
    const mockItems = [
      {
        id: 1,
        returnExchangeId: 1,
        productCode: 'SKU001',
        productName: '商品1',
        quantity: 5,
        price: 99.99,
        totalAmount: 499.95,
        status: ExchangeItemStatus.SHIPPED,
        shippedAt: '2024-11-04T10:00:00Z',
        receivedAt: null,
        createdAt: '2024-11-04T00:00:00Z',
        updatedAt: '2024-11-04T10:00:00Z',
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockItems }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockItems[0] }),
      });

    const { result } = renderHook(() =>
      useExchangeItems({
        orderCode: 'ORD001',
        tenantType: 'market',
      })
    );

    await waitFor(() => {
      expect(result.current.exchangeItems.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.updateExchangeItemStatus(
        1,
        ExchangeItemStatus.RECEIVED
      );
    });

    expect(result.current.exchangeItems[0].status).toBe(
      ExchangeItemStatus.RECEIVED
    );
  });

  it('should return available actions based on tenant and status', () => {
    const mockItems = [
      {
        id: 1,
        status: ExchangeItemStatus.SHIPPED,
      } as any,
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockItems }),
    });

    const { result } = renderHook(() =>
      useExchangeItems({
        orderCode: 'ORD001',
        tenantType: 'market',
      })
    );

    const actions = result.current.getAvailableActions(mockItems[0]);
    expect(actions).toContain('receive');
    expect(actions).toContain('reject');
  });
});
```

### 集成测试

```typescript
// e2e 测试场景

describe('Exchange Items 完整流程', () => {
  it('should complete exchange flow: provider ships -> market receives -> customer confirms', () => {
    // 1. Provider 发货
    cy.login('provider');
    cy.visit('/orders/ORD001');
    cy.contains('发货').click();
    cy.get('[data-testid="exchange-items-table"]').within(() => {
      cy.contains('button', '发货').click();
    });
    cy.contains('确认').click();

    // 2. Market 收货
    cy.login('market');
    cy.visit('/orders/ORD001');
    cy.contains('确认收货').click();
    cy.contains('确认').click();

    // 3. Customer 确认完成
    cy.login('customer');
    cy.visit('/orders/ORD001');
    cy.contains('确认完成').click();
    cy.contains('确认').click();

    // 验证状态
    cy.contains('已完成').should('be.visible');
  });
});
```

---

## 注意事项

1. **权限验证**: 始终在前端验证权限，但后端也必须验证
2. **乐观更新**: 考虑在获得服务器确认前先更新本地状态
3. **缓存策略**: 避免频繁的 API 调用，使用适当的缓存
4. **错误恢复**: 实现自动重试和降级策略
5. **审计日志**: 记录所有状态变更以便追踪
6. **性能优化**: 对大量商品使用虚拟滚动
7. **可访问性**: 确保表格和对话框支持键盘导航
