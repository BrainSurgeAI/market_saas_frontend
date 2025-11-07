# Exchange Items 快速开始指南

## 📋 前提条件

1. ✅ 后端已实现 `/api/orders/:code/exchange-items` API 端点
2. ✅ 数据库中 `exchange_items` 表已创建
3. ✅ 类型定义已在 `lib/types/orderStatus.ts` 中添加

## 🚀 5 分钟快速集成

### Step 1: 导入 Hook

```typescript
import { useExchangeItems } from '@/app/workspace/hooks/useExchangeItems';
```

### Step 2: 在组件中使用

```tsx
export function OrderDetail({ orderCode, tenantType }) {
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
  });

  // 渲染逻辑...
}
```

### Step 3: 集成表格组件

```tsx
import { ExchangeItemsTable } from '@/app/workspace/components/orders/ExchangeItemsTable';

<ExchangeItemsTable
  items={exchangeItems}
  loading={loading}
  tenantType={tenantType}
  onStatusChange={async (itemId, newStatus, reason) => {
    await updateExchangeItemStatus(itemId, newStatus, reason);
  }}
  canPerformAction={canPerformAction}
  getStatusLabel={getStatusLabel}
  getStatusVariant={getStatusVariant}
/>
```

---

## 📝 完整代码示例

### 在 `OrderDetails.tsx` 中集成

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useExchangeItems } from "@/app/workspace/hooks/useExchangeItems";
import { ExchangeItemsTable } from "./ExchangeItemsTable";
import type { ExchangeItemStatus } from "@/lib/types/orderStatus";
import { ExchangeItemStatus } from "@/lib/types/orderStatus";

interface OrderDetailProps {
  orderCode: string;
  orgId: string;
  tenantType: string;
}

export default function OrderDetail({
  orderCode,
  orgId,
  tenantType,
}: OrderDetailProps) {
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
  });

  // 处理状态变更
  const handleStatusChange = async (
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
    } catch (err) {
      toast({
        title: "更新失败",
        description: err instanceof Error ? err.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 其他订单卡片... */}

      {/* 换货商品卡片 */}
      {exchangeItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              换货商品 ({exchangeItems.length} 项)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-red-500 mb-4">
                加载失败: {error}
              </div>
            )}
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
      )}
    </div>
  );
}
```

---

## 🔄 工作流程

### Provider (供应商) 工作流

```
1. 订单进入 EXCHANGE_REQUESTED 状态
2. Provider 查看换货商品列表
3. 点击"发货"按钮
4. 商品状态: PENDING → SHIPPED
5. 等待 Market 收货
```

### Market (市场) 工作流

```
1. 收到 Provider 发货通知
2. 查看换货商品列表
3. 选择"确认收货"或"拒收"
4. 若收货: SHIPPED → RECEIVED
5. 若拒收: SHIPPED → REJECTED → 通知 Provider 重新发货
6. 收货后点击"完成处理": RECEIVED → COMPLETED
```

### Customer (客户) 工作流

```
1. Market 已完成验收
2. 查看换货商品列表
3. 点击"确认完成"
4. 商品状态: RECEIVED → COMPLETED
5. 订单完成
```

---

## 🛠️ 常见任务

### 查看当前用户可执行的操作

```typescript
const item = exchangeItems[0];
const availableActions = getAvailableActions(item);
console.log(availableActions); // ['receive', 'reject'] (for market)
```

### 检查是否可以执行特定操作

```typescript
const canReceive = canPerformAction(item, 'receive');
if (canReceive) {
  // 显示"确认收货"按钮
}
```

### 获取状态的中文标签

```typescript
const label = getStatusLabel(ExchangeItemStatus.SHIPPED);
console.log(label); // "已发货"
```

### 获取状态的样式

```typescript
const variant = getStatusVariant(ExchangeItemStatus.PENDING);
// 返回: 'secondary'
```

---

## 📊 权限对照表

| 操作 | Provider | Market | Customer |
|------|---------|--------|----------|
| 发货 | ✅ | ❌ | ❌ |
| 确认收货 | ❌ | ✅ | ❌ |
| 拒收 | ❌ | ✅ | ❌ |
| 完成处理 | ❌ | ✅ | ❌ |
| 确认完成 | ❌ | ❌ | ✅ |

---

## 🐛 调试技巧

### 1. 查看当前加载状态

```typescript
console.log('Loading:', loading);
console.log('Error:', error);
console.log('Items count:', exchangeItems.length);
```

### 2. 检查权限

```typescript
exchangeItems.forEach(item => {
  console.log(`Item ${item.id}:`, {
    status: item.status,
    actions: getAvailableActions(item),
  });
});
```

### 3. 监听状态变更

```typescript
// 在处理状态变更时添加日志
const handleStatusChange = async (itemId, newStatus, reason) => {
  console.log(`Changing item ${itemId} to ${newStatus}`, { reason });
  await updateExchangeItemStatus(itemId, newStatus, reason);
};
```

### 4. 检查 API 响应

在浏览器 DevTools 的 Network 标签中查看 `/api/orders/:code/exchange-items` 的响应。

---

## ⚠️ 常见问题

### Q: 为什么看不到换货商品？

**A:** 检查以下几点：
1. 订单状态是否为 `EXCHANGE_REQUESTED` 或相关状态
2. 后端是否有相关的 exchange_items 数据
3. API 是否返回了数据（检查 Network 标签）
4. Hook 的 `enabled` 参数是否为 `true`

### Q: 操作按钮为什么是禁用的？

**A:** 可能原因：
1. 当前用户的权限不允许该操作
2. 商品状态不符合该操作的前提条件
3. 还有其他正在进行的操作（submitting = true）

### Q: 如何实现批量操作？

**A:** 使用 `updateMultipleItems` 方法：

```typescript
const handleBatchAction = async (itemIds: number[]) => {
  await updateMultipleItems(
    itemIds,
    ExchangeItemStatus.RECEIVED
  );
};
```

### Q: 如何添加自定义操作？

**A:** 在 `useExchangeItems` hook 中扩展 `getAvailableActions`：

```typescript
// 修改 hook 中的权限逻辑
if (tenant === TenantType.MARKET) {
  if (status === ExchangeItemStatus.SHIPPED) {
    actions.push('receive', 'reject', 'custom-action');
  }
}
```

---

## 📱 移动端适配

表格组件已内置响应式设计：
- 桌面端: 完整表格显示
- 平板端: 表格自适应
- 手机端: 可水平滚动

---

## 🚦 测试检查清单

- [ ] 能看到换货商品列表
- [ ] 权限按钮正确显示
- [ ] 可以执行相应的操作
- [ ] 操作后状态更新正确
- [ ] 错误提示正常显示
- [ ] 加载状态正确
- [ ] 批量操作正常工作

---

## 📚 相关文档

- [完整 API 文档](./EXCHANGE_ITEMS_API.md)
- [集成指南](./EXCHANGE_ITEMS_INTEGRATION_GUIDE.md)
- [类型定义](../lib/types/orderStatus.ts)
- [Hook 源码](../app/workspace/hooks/useExchangeItems.ts)
- [表格组件](../app/workspace/components/orders/ExchangeItemsTable.tsx)

---

## 💬 获得帮助

遇到问题？
1. 查看浏览器控制台的错误信息
2. 检查 Network 标签中的 API 响应
3. 参考相关文档
4. 检查权限矩阵是否符合当前用户角色
5. 确认后端 API 已正确实现
