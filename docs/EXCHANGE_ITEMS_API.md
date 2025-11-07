# Exchange Items API 文档

## 概述

换货商品管理 API 提供了对换货流程中商品信息的完整 CRUD 操作和状态管理。

## 数据库模式

```sql
CREATE TABLE exchange_items (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    return_exchange_id INT NOT NULL COMMENT '关联的退换货记录ID',
    product_code VARCHAR(10) NOT NULL COMMENT '换货产品编号',
    product_name VARCHAR(100) NOT NULL COMMENT '换货产品名称',
    quantity DECIMAL(10,2) NOT NULL COMMENT '换货数量',
    price DECIMAL(10,2) NOT NULL COMMENT '换货产品单价',
    total_amount DECIMAL(12,2) NOT NULL COMMENT '换货总金额',
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING' COMMENT '状态',
    shipped_at TIMESTAMP NULL COMMENT '发货时间',
    received_at TIMESTAMP NULL COMMENT '收货时间',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    CONSTRAINT fk_exchange_items_return_exchange FOREIGN KEY (return_exchange_id) 
    REFERENCES return_exchange_records(id) ON DELETE CASCADE,
    INDEX idx_return_exchange_id (return_exchange_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='换货商品表';
```

## 状态流转

### 状态定义

| 状态 | 值 | 描述 |
|------|----|----|
| 待发货 | PENDING | 初始状态，等待供应商发货 |
| 已发货 | SHIPPED | 供应商已发货，市场待收货 |
| 已收货 | RECEIVED | 市场已收货，客户待确认 |
| 已拒收 | REJECTED | 市场已拒收，重新协商 |
| 已完成 | COMPLETED | 整个换货流程已完成 |

### 流转图

```
┌─────────┐
│ PENDING │ (供应商发货)
└────┬────┘
     │
     ▼
┌─────────┐
│ SHIPPED │ (市场收货或拒收)
└────┬─────┬─────────┐
     │     │         │
     ▼     ▼         ▼
 RECEIVED REJECTED (重新协商)
     │
     ▼
┌─────────────┐
│  COMPLETED  │ (客户确认)
└─────────────┘
```

## API 端点

### 1. 获取换货商品列表

```http
GET /api/orders/:orderCode/exchange-items
```

**请求参数：**
- `orderCode` (path, string, 必需): 订单编号

**请求头：**
```
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "returnExchangeId": 10,
      "productCode": "SKU001",
      "productName": "澳洲谷饲牛腱",
      "quantity": 5,
      "price": 89.99,
      "totalAmount": 449.95,
      "status": "PENDING",
      "shippedAt": null,
      "receivedAt": null,
      "createdAt": "2024-11-04T10:00:00Z",
      "updatedAt": "2024-11-04T10:00:00Z"
    }
  ],
  "message": "Success"
}
```

---

### 2. 获取单个换货商品

```http
GET /api/orders/:orderCode/exchange-items/:itemId
```

**请求参数：**
- `orderCode` (path, string, 必需): 订单编号
- `itemId` (path, number, 必需): 换货商品ID

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "returnExchangeId": 10,
    "productCode": "SKU001",
    "productName": "澳洲谷饲牛腱",
    "quantity": 5,
    "price": 89.99,
    "totalAmount": 449.95,
    "status": "PENDING",
    "shippedAt": null,
    "receivedAt": null,
    "createdAt": "2024-11-04T10:00:00Z",
    "updatedAt": "2024-11-04T10:00:00Z"
  },
  "message": "Success"
}
```

---

### 3. 更新换货商品状态

```http
PATCH /api/orders/:orderCode/exchange-items/:itemId
```

**请求参数：**
- `orderCode` (path, string, 必需): 订单编号
- `itemId` (path, number, 必需): 换货商品ID

**请求体：**
```json
{
  "status": "SHIPPED",
  "reason": "已通过快递发货，单号为#123456",
  "updatedBy": "provider"
}
```

**字段说明：**
- `status` (string, 必需): 新状态，必须是合法的状态值
- `reason` (string, 可选): 状态变更说明（拒收、退货等需要）
- `updatedBy` (string, 必需): 操作者身份 (provider/market/customer)

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "returnExchangeId": 10,
    "productCode": "SKU001",
    "productName": "澳洲谷饲牛腱",
    "quantity": 5,
    "price": 89.99,
    "totalAmount": 449.95,
    "status": "SHIPPED",
    "shippedAt": "2024-11-04T14:30:00Z",
    "receivedAt": null,
    "createdAt": "2024-11-04T10:00:00Z",
    "updatedAt": "2024-11-04T14:30:00Z"
  },
  "message": "Success"
}
```

**错误响应：**
```json
{
  "code": -1,
  "data": null,
  "message": "Invalid status transition from PENDING to COMPLETED"
}
```

---

### 4. 批量更新换货商品状态

```http
PATCH /api/orders/:orderCode/exchange-items/batch
```

**请求体：**
```json
{
  "itemIds": [1, 2, 3],
  "status": "RECEIVED",
  "updatedBy": "market"
}
```

**响应示例：**
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "status": "RECEIVED",
      "receivedAt": "2024-11-04T16:00:00Z",
      "updatedAt": "2024-11-04T16:00:00Z"
    },
    {
      "id": 2,
      "status": "RECEIVED",
      "receivedAt": "2024-11-04T16:00:00Z",
      "updatedAt": "2024-11-04T16:00:00Z"
    },
    {
      "id": 3,
      "status": "RECEIVED",
      "receivedAt": "2024-11-04T16:00:00Z",
      "updatedAt": "2024-11-04T16:00:00Z"
    }
  ],
  "message": "Success"
}
```

---

## 权限矩阵

### Provider (供应商)
| 操作 | 当前状态 | 新状态 | 权限 |
|------|---------|--------|------|
| 发货 | PENDING | SHIPPED | ✅ |
| 拒收处理 | REJECTED | - | ❌ |
| 完成处理 | - | COMPLETED | ❌ |

### Market (市场)
| 操作 | 当前状态 | 新状态 | 权限 |
|------|---------|--------|------|
| 确认收货 | SHIPPED | RECEIVED | ✅ |
| 拒收 | SHIPPED | REJECTED | ✅ |
| 完成验收 | RECEIVED | COMPLETED | ✅ |
| 发货 | PENDING | SHIPPED | ❌ |

### Customer (客户)
| 操作 | 当前状态 | 新状态 | 权限 |
|------|---------|--------|------|
| 确认完成 | RECEIVED | COMPLETED | ✅ |
| 其他操作 | - | - | ❌ |

---

## 状态转换规则

### 合法转换

1. **PENDING → SHIPPED**
   - 条件: 供应商确认发货
   - 必须字段: `updatedBy=provider`
   - 可选: 快递单号等信息在 `reason`

2. **SHIPPED → RECEIVED**
   - 条件: 市场确认收货
   - 必须字段: `updatedBy=market`

3. **SHIPPED → REJECTED**
   - 条件: 市场拒收
   - 必须字段: `updatedBy=market`, `reason` (拒收原因)

4. **RECEIVED → COMPLETED**
   - 条件: 客户确认完成或市场完成验收
   - 必须字段: `updatedBy=market|customer`

5. **REJECTED → PENDING** (重新发货)
   - 条件: 协商后重新发货
   - 必须字段: `updatedBy=provider`

### 非法转换

以下转换将被拒绝：
- PENDING → RECEIVED (跳过SHIPPED)
- PENDING → COMPLETED (跳过中间状态)
- RECEIVED → PENDING (不可回退)
- COMPLETED → * (终态，不可再变更)
- REJECTED → RECEIVED (必须先返回PENDING)

---

## 实现示例

### Node.js/Express Backend (示例)

```javascript
// GET /api/orders/:orderCode/exchange-items
router.get('/api/orders/:orderCode/exchange-items', async (req, res) => {
  const { orderCode } = req.params;
  
  try {
    const items = await db.query(
      `SELECT ei.* FROM exchange_items ei
       JOIN return_exchange_records rer ON ei.return_exchange_id = rer.id
       WHERE rer.order_code = ?`,
      [orderCode]
    );
    
    res.json({
      code: 0,
      data: items,
      message: 'Success'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      data: null,
      message: error.message
    });
  }
});

// PATCH /api/orders/:orderCode/exchange-items/:itemId
router.patch('/api/orders/:orderCode/exchange-items/:itemId', async (req, res) => {
  const { orderCode, itemId } = req.params;
  const { status, reason, updatedBy } = req.body;
  
  try {
    // 验证状态转换
    const current = await db.query(
      'SELECT status FROM exchange_items WHERE id = ?',
      [itemId]
    );
    
    if (!isValidTransition(current[0].status, status, updatedBy)) {
      return res.status(400).json({
        code: -1,
        data: null,
        message: `Invalid status transition from ${current[0].status} to ${status}`
      });
    }
    
    // 更新状态
    const updateData = { status, updated_at: new Date() };
    if (status === 'SHIPPED') {
      updateData.shipped_at = new Date();
    } else if (status === 'RECEIVED') {
      updateData.received_at = new Date();
    }
    
    await db.query(
      'UPDATE exchange_items SET ? WHERE id = ?',
      [updateData, itemId]
    );
    
    const updated = await db.query(
      'SELECT * FROM exchange_items WHERE id = ?',
      [itemId]
    );
    
    res.json({
      code: 0,
      data: updated[0],
      message: 'Success'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      data: null,
      message: error.message
    });
  }
});
```

---

## 错误处理

### 常见错误码

| 代码 | 消息 | 原因 |
|------|------|------|
| 400 | Invalid status transition | 不允许的状态转换 |
| 404 | Exchange item not found | 商品不存在 |
| 403 | Permission denied | 权限不足 |
| 500 | Internal server error | 服务器错误 |

---

## 最佳实践

1. **使用 transactional updates**: 批量更新时使用数据库事务确保一致性
2. **记录审计日志**: 每次状态变更都应记录操作者、时间、原因
3. **验证权限**: 在每个端点验证用户是否有权进行该操作
4. **缓存 exchange_items 数据**: 在获取订单详情时预加载，减少 API 调用
5. **异步通知**: 状态变更时发送通知给相关各方
