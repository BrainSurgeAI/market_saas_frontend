/**
 * 对账单状态枚举
 */
export type ReconciliationStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED';

/**
 * 对账单状态显示映射
 */
export const ReconciliationStatusMap: Record<ReconciliationStatus, { label: string; color: string }> = {
  PENDING: { label: '待确认', color: 'yellow' },
  CONFIRMED: { label: '已确认', color: 'blue' },
  COMPLETED: { label: '已完成', color: 'green' },
  REJECTED: { label: '已拒绝', color: 'red' }
};

/**
 * 对账单数据接口
 */
export interface ReconciliationStatement {
  id: number;
  statementCode: string;
  customerId: number;
  marketId: number;
  providerId: number;
  supplierName: string | null;
  customerName: string | null;
  startDate: string;
  endDate: string;
  totalAmount: string;
  discountAmount: string;
  actualAmount: string;
  status: ReconciliationStatus;
  remark: string | null;
  createdBy: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
  completedBy: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * 对账单API响应接口
 */
export interface ReconciliationStatementsResponse {
  code: number;
  message: string;
  data: ReconciliationStatement[];
  requestId: string;
  timestamp: string;
}

/**
 * 实体类型枚举
 */
export type EntityType = 'customer' | 'provider' | 'market';

/**
 * 对账单查询参数接口
 */
export interface ReconciliationStatementsQuery {
  customerId?: string;
  providerId?: string;
  marketId?: string;
  status?: ReconciliationStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 通用实体查询参数
 */
export interface EntityReconciliationQuery {
  entityType: EntityType;
  entityId: string;
  query?: Omit<ReconciliationStatementsQuery, 'customerId' | 'providerId' | 'marketId'>;
}

/**
 * 对账单订单数据接口
 */
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

/**
 * 对账单订单API响应接口
 */
export interface ReconciliationOrdersResponse {
  code: number;
  message: string;
  data: ReconciliationOrder[];
  requestId: string;
  timestamp: string;
} 