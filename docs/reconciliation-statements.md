# 对账单功能架构文档

## 概述

对账单功能为客户、供应商和市场三种实体类型提供统一的对账单管理界面。通过共享组件和服务的设计，实现了代码复用和一致的用户体验。支持点击对账单查看详细的订单信息。

## 功能特性

### 核心功能
- 📊 对账单统计概览（总数、总金额、优惠金额、实际金额）
- 📈 状态分布统计
- 📋 对账单明细列表
- 🔍 按月份归纳显示
- 💰 金额格式化（人民币）
- 📅 日期本地化显示
- 🏷️ 状态徽章展示
- **✨ 点击对账单查看订单详情（滑动面板）**
- **📦 订单列表展示和统计**

### 技术特性
- ⚡ Next.js App Router 服务器组件
- 🎨 shadcn/ui + Tailwind CSS 响应式设计
- 🔒 TypeScript 强类型安全
- 🧪 Vitest 单元测试覆盖
- 🔄 数据缓存和重新验证
- 💀 加载骨架屏优化用户体验
- **🎭 滑动面板交互体验**

## 架构设计

### 文件结构

```
app/
├── types/
│   └── reconciliationTypes.ts          # 对账单和订单类型定义
├── components/
│   ├── InvoiceSettlementsPageLayout.tsx     # 共享页面布局
│   ├── ReconciliationStatementsContent.tsx  # 共享内容组件
│   ├── ReconciliationStatementList.tsx      # 对账单列表组件
│   ├── ReconciliationStatementListWithSheet.tsx  # 带滑动面板的列表包装器
│   ├── ReconciliationOrderSheet.tsx         # 订单详情滑动面板
│   ├── ReconciliationOrderList.tsx          # 订单列表组件
│   └── __tests__/
│       └── ReconciliationOrderSheet.test.tsx # 滑动面板测试
├── workspace/
│   ├── customers/[customer_id]/invoiceSettlements/
│   │   ├── page.tsx                     # 客户对账单页面
│   │   └── __tests__/page.test.tsx      # 客户页面测试
│   ├── providers/[provider_id]/invoiceSettlements/
│   │   ├── page.tsx                     # 供应商对账单页面
│   │   └── __tests__/page.test.tsx      # 供应商页面测试
│   └── markets/[market_id]/invoiceSettlements/
│       ├── page.tsx                     # 市场对账单页面
│       └── __tests__/page.test.tsx      # 市场页面测试
lib/
└── reconciliation-service.ts           # 对账单和订单数据服务
```

### 组件层次结构

```
InvoiceSettlementsPageLayout (共享布局)
├── 页面标题 (实体类型感知)
└── ReconciliationStatementsContent (共享内容)
    └── ReconciliationStatementListWithSheet (包装器)
        ├── ReconciliationStatementList (列表展示)
        │   ├── 统计概览卡片
        │   ├── 状态分布统计
        │   └── 对账单明细表格 (支持点击)
        └── ReconciliationOrderSheet (滑动面板)
            ├── 对账单概要信息
            └── ReconciliationOrderList (订单列表)
                ├── 订单统计卡片
                └── 订单明细表格
```

## 类型定义

### 核心类型

```typescript
// 实体类型
export type EntityType = 'customer' | 'provider' | 'market';

// 对账单状态
export type ReconciliationStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED';

// 对账单数据
export interface ReconciliationStatement {
  id: number;
  statementCode: string;
  customerId: number;
  marketId: number;
  providerId: number;
  startDate: string;
  endDate: string;
  totalAmount: string;
  discountAmount: string;
  actualAmount: string;
  status: ReconciliationStatus;
  // ... 其他字段
}

// 订单数据
export interface ReconciliationOrder {
  id: number;
  statementId: number;
  orderId: number;
  orderCode: string;
  orderDate: string;
  totalAmount: string;
  actualAmount: string;
  createdAt: string;
}

// 通用查询参数
export interface EntityReconciliationQuery {
  entityType: EntityType;
  entityId: string;
  query?: ReconciliationStatementsQuery;
}
```

## API 接口

### 获取对账单列表

- **URL**: `/api/v1/reconciliation_statements`
- **方法**: GET
- **认证**: Bearer Token

### 获取对账单订单详情

- **URL**: `/api/v1/reconciliation_statements/{id}`
- **方法**: GET
- **认证**: Bearer Token

### 查询参数
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| customerId | string | 否 | 客户ID |
| providerId | string | 否 | 供应商ID |
| marketId | string | 否 | 市场ID |
| status | ReconciliationStatus | 否 | 对账单状态 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页大小 |

### 响应格式

#### 对账单列表响应
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
      "createdAt": "2025-05-23T04:35:59Z",
      "updatedAt": "2025-05-23T04:35:59Z"
    }
  ],
  "requestId": "e4f2fdc5-bc7b-41d9-a36f-1f2d9937506a",
  "timestamp": "2025-05-24T12:16:35.316548158Z"
}
```

#### 对账单订单详情响应
```json
{
  "code": 200,
  "message": "success", 
  "data": [
    {
      "id": 1,
      "statementId": 1,
      "orderId": 1,
      "orderCode": "ODR-20250522113839492-UYRA",
      "orderDate": "2025-05-22",
      "totalAmount": "20.93",
      "actualAmount": "17.37",
      "createdAt": "2025-05-23T04:35:59Z"
    }
  ],
  "requestId": "a8f003a5-3dde-4359-a9ee-e4b9e74e8a49",
  "timestamp": "2025-05-24T14:56:57.181899287Z"
}
```

## 服务层设计

### 通用服务函数

```typescript
// 通用获取实体对账单
export async function getEntityReconciliationStatements(
  entityQuery: EntityReconciliationQuery
): Promise<ReconciliationStatement[]>

// 获取对账单订单详情
export async function getReconciliationOrders(
  statementId: number
): Promise<ReconciliationOrder[]>

// 客户专用（向后兼容）
export async function getReconciliationStatements(
  customerId: string,
  query?: ReconciliationStatementsQuery
): Promise<ReconciliationStatement[]>
```

### 缓存策略
- 对账单缓存标签: `reconciliation-statements-{entityType}-{entityId}`
- 订单缓存标签: `reconciliation-orders-{statementId}`
- 缓存时间: 15分钟（开发环境不缓存）
- 支持手动重新验证

## 页面路由

| 实体类型 | 路由路径 | 页面组件 |
|----------|----------|----------|
| 客户 | `/workspace/customers/[customer_id]/invoiceSettlements` | `InvoiceSettlementsPage` |
| 供应商 | `/workspace/providers/[provider_id]/invoiceSettlements` | `ProviderInvoiceSettlementsPage` |
| 市场 | `/workspace/markets/[market_id]/invoiceSettlements` | `MarketInvoiceSettlementsPage` |

## 共享组件设计

### InvoiceSettlementsPageLayout
- **职责**: 提供统一的页面布局和导航
- **特性**: 
  - 实体类型感知的标题
  - 统一的加载状态
  - 响应式布局

### ReconciliationStatementsContent
- **职责**: 数据获取和内容渲染
- **特性**:
  - 服务器组件数据获取
  - 错误处理
  - 统一的数据传递

### ReconciliationStatementListWithSheet
- **职责**: 状态管理和交互协调
- **特性**:
  - 客户端状态管理
  - 点击事件处理
  - 滑动面板控制

### ReconciliationStatementList
- **职责**: 对账单数据展示
- **特性**:
  - 统计概览卡片
  - 状态分布图表
  - 响应式表格
  - 点击交互支持
  - 空状态处理

### ReconciliationOrderSheet
- **职责**: 订单详情滑动面板
- **特性**:
  - 滑动动画效果
  - 对账单概要显示
  - 订单数据动态加载
  - 响应式宽度调整（移动端100vw全屏，小屏95vw，中屏90vw，大屏85vw，超大屏80vw）
  - 覆盖shadcn/ui默认max-width限制（添加`sm:max-w-none max-w-none`）
  - 表格水平滚动支持
  - 优化的列宽分配

### ReconciliationOrderList
- **职责**: 订单列表展示
- **特性**:
  - 订单统计概览
  - 订单明细表格
  - 加载状态处理
  - 空状态处理

## 用户交互流程

### 查看订单详情流程
1. **浏览对账单**: 用户在对账单列表中浏览数据
2. **点击对账单**: 点击任意对账单行触发详情查看
3. **面板滑出**: 从右侧滑出订单详情面板
4. **加载订单**: 自动调用API获取订单数据
5. **展示内容**: 显示对账单概要和订单列表
6. **关闭面板**: 点击遮罩或关闭按钮关闭面板

### 交互提示
- 表格行悬停效果提示可点击
- 眼睛图标视觉提示
- 描述文字说明操作方式
- 加载状态反馈

## 状态管理

### 对账单状态
- `PENDING`: 待确认 (黄色徽章)
- `CONFIRMED`: 已确认 (蓝色徽章)
- `COMPLETED`: 已完成 (绿色徽章)
- `REJECTED`: 已拒绝 (红色徽章)

### 组件状态
- 选中的对账单 (`selectedStatement`)
- 面板开启状态 (`sheetOpen`)
- 订单加载状态 (`loading`)
- 订单数据 (`orders`)

## 测试策略

### 单元测试覆盖
- ✅ 页面渲染测试
- ✅ API 调用参数验证
- ✅ 数据展示测试
- ✅ 点击交互测试
- ✅ 滑动面板开关测试
- ✅ 订单数据加载测试
- ✅ 空状态处理测试
- ✅ 加载状态测试
- ✅ 错误处理测试

### 测试工具
- **框架**: Vitest
- **渲染**: @testing-library/react
- **用户交互**: @testing-library/user-event
- **断言**: @testing-library/jest-dom
- **模拟**: vi.mock

## 性能优化

### 服务器端优化
- 使用 Next.js 服务器组件减少客户端 JavaScript
- 数据缓存减少 API 调用
- 按需加载订单数据

### 客户端优化
- 延迟加载订单数据（只在面板打开时请求）
- 面板关闭时延迟清理状态，避免动画中断
- 组件状态优化，避免不必要的重新渲染

### 用户体验优化
- 滑动面板动画效果
- 加载骨架屏提升感知性能
- 响应式设计适配各种设备
- 错误边界处理异常情况

## 扩展性设计

### 新增实体类型
1. 在 `EntityType` 中添加新类型
2. 更新 `EntityTypeDisplayMap` 映射
3. 创建对应的页面组件

### 新增功能
- 支持导出对账单和订单
- 添加筛选和搜索功能
- 实现订单详情页面跳转
- 添加批量操作功能
- 支持订单状态更新
- 添加打印功能

## 最佳实践

### 代码组织
- 📁 按功能模块组织文件
- 🔄 最大化代码复用
- 🎯 单一职责原则
- 📝 完整的类型定义
- 🧩 组件组合模式

### 用户体验
- 🎨 一致的视觉设计
- ⚡ 快速的页面加载
- 📱 响应式适配
- 🔍 清晰的信息层次
- 🎭 流畅的交互动画

### 开发体验
- 🛡️ 类型安全保障
- 🧪 全面的测试覆盖
- 📚 详细的文档说明
- 🔧 易于维护和扩展
- 🎯 清晰的错误处理 