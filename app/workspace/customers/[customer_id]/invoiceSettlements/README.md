# 客户对账单总览页面

## 功能描述

此页面用于显示指定客户的每月对账单总览数据，包括：

- 对账单统计概览（总数、总金额、优惠金额、实际金额）
- 状态分布统计
- 对账单明细列表

## 文件结构

```
app/workspace/customers/[customer_id]/invoiceSettlements/
├── page.tsx                 # 主页面组件
├── __tests__/              # 测试文件目录
│   └── page.test.tsx       # 页面组件测试
└── README.md               # 说明文档
```

## 相关文件

- `app/types/reconciliationTypes.ts` - 对账单相关类型定义
- `lib/reconciliation-service.ts` - 对账单数据获取服务
- `app/components/ReconciliationStatementList.tsx` - 对账单列表显示组件

## 技术特性

### 服务器组件
- 使用 Next.js App Router 的服务器组件
- 通过 `fetchRemoteData` 函数从远程 API 获取数据
- 支持数据缓存和重新验证

### 用户界面
- 使用 shadcn/ui 组件库
- 响应式设计，支持移动端
- 包含加载骨架屏提升用户体验
- 美观的统计卡片和表格展示

### 类型安全
- 完整的 TypeScript 类型定义
- 强类型的 API 响应处理
- 避免使用 `any` 类型

### 数据展示功能
- 金额格式化（人民币）
- 日期格式化（中文本地化）
- 状态徽章显示
- 月份归纳显示

## API 接口

### 获取对账单数据

**端点**: `/reconciliation_statements`

**方法**: GET

**查询参数**:
- `customerId` (必需): 客户ID
- `status` (可选): 对账单状态
- `startDate` (可选): 开始日期
- `endDate` (可选): 结束日期
- `page` (可选): 页码
- `pageSize` (可选): 每页大小

**响应格式**:
```json
{
    "code": 200,
    "message": "success",
    "data": [
        {
            "id": 1,
            "statementCode": "RS-20250523043559711-PEPY-2-1-15",
            "customerId": 2,
            "marketId": 1,
            "providerId": 15,
            "startDate": "2025-05-01",
            "endDate": "2025-05-31",
            "totalAmount": "100.23",
            "discountAmount": "17.04",
            "actualAmount": "83.19",
            "status": "PENDING",
            "remark": null,
            "createdBy": "system",
            "confirmedBy": null,
            "confirmedAt": null,
            "completedBy": null,
            "completedAt": null,
            "createdAt": "2025-05-23T04:35:59Z",
            "updatedAt": "2025-05-23T04:35:59Z",
            "deletedAt": null
        }
    ],
    "requestId": "e4f2fdc5-bc7b-41d9-a36f-1f2d9937506a",
    "timestamp": "2025-05-24T12:16:35.316548158Z"
}
```

## 状态说明

- `PENDING`: 待确认
- `CONFIRMED`: 已确认  
- `COMPLETED`: 已完成
- `REJECTED`: 已拒绝

## 使用方式

1. 访问路径: `/workspace/customers/{customer_id}/invoiceSettlements`
2. 页面会自动加载该客户的对账单数据
3. 支持面包屑导航返回上级页面

## 测试

运行测试命令：
```bash
npm test app/workspace/customers/[customer_id]/invoiceSettlements/__tests__/page.test.tsx
```

测试覆盖：
- 页面渲染
- 数据加载
- 空数据处理
- 金额格式化
- 日期显示
- 状态徽章

## 最佳实践

1. **性能优化**：使用服务器组件减少客户端 JavaScript
2. **用户体验**：提供加载状态和空状态处理
3. **数据安全**：通过服务器端验证用户权限
4. **可维护性**：清晰的类型定义和组件分离
5. **国际化**：支持中文本地化格式 