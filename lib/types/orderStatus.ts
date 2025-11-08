export enum OrderStatus {
  // === 普通流程 ===
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  SUPPLIER_PREPARING = 'SUPPLIER_PREPARING',
  SUPPLIER_DELIVERING = 'SUPPLIER_DELIVERING',
  MARKET_INSPECTING = 'MARKET_INSPECTING',
  MARKET_ACCEPTED = 'MARKET_ACCEPTED',
  MARKET_DELIVERING = 'MARKET_DELIVERING',
  CUSTOMER_INSPECTING = 'CUSTOMER_INSPECTING',
  COMPLETED = 'COMPLETED',

  // === 退货流程 ===
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURNED = 'RETURNED',

  // === 换货流程 ===
  EXCHANGE_REQUESTED = 'EXCHANGE_REQUESTED',
  EXCHANGE_IN_PROGRESS = 'EXCHANGE_IN_PROGRESS',
  EXCHANGE_DELIVERING = 'EXCHANGE_DELIVERING',
  EXCHANGE_INSPECTING = 'EXCHANGE_INSPECTING',
  EXCHANGE_NEW_DELIVERING = 'EXCHANGE_NEW_DELIVERING',
  EXCHANGE_COMPLETED = 'EXCHANGE_COMPLETED',

  // === 通用终态 ===
  CANCELLED = 'CANCELLED',
}

export enum OperationType {
  RETURN = 'RETURN',
  EXCHANGE = 'EXCHANGE',
  SIGN = 'SIGN',
}

export enum ExchangeItemStatus {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED',
  RECEIVED = 'RECEIVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export enum TenantType {
  PROVIDER = 'provider',
  MARKET = 'market',
  CUSTOMER = 'customer',
}

export interface DeliveryPerson {
  id: number;
  name: string;
  phone: string;
  idCard: string;
  status: number;
}

export interface OrderItem {
  id: number;
  productId: string;
  name: string;
  categoryId: number;
  category: string;
  unit: string;
  quantity: string;
  price: string;
  discountRate: string;
  actualPrice: string;
  total: string;
  processingRequirements: string | null;
  remark: string | null;
  acceptedQuantity: string;
  actualAmount: string;
  status: string;
  deliveredQuantity: string;
}

export interface ExchangeItem {
  id: number;
  returnExchangeId: number;
  productCode: string;
  productName: string;
  quantity: number;
  requestedQuantity?: number; // 供应商需要的换货量
  actualQuantity?: number; // 实际发货量
  price: number;
  totalAmount: number;
  status: ExchangeItemStatus;
  shippedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetail {
  id: number;
  orderCode: string;
  customerName: string;
  orderStatus: string;
  totalAmount: string;
  discountAmount: string;
  actualAmount: string;
  deliveryDate: string;
  deliveryAddress: string;
  contactName: string;
  contactPhone: string;
  remark: string | null;
  createdBy: string;
  createdAt: string;
  confirmBy: string | null;
  confirmedAt: string | null;
  cancelBy: string | null;
  cancelledAt: string | null;
  afterSaleAt: string | null;
  rejectBy: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  completedBy: string | null;
  deliveryStaffName: string | null;
  deliveryStaffPhone: string | null;
  providerName: string | null;
}

export interface ReturnExchangeItem {
  orderId: string;
  id: number;
  productId: string;
  productName: string;
  operationType: OperationType;
  quantity: number;
  reason: string;
  unit: string;
}

export interface ExchangeReturnRecord {
  orderDetailId: number;
  operationType: OperationType;
  quantity: string;
  reason: string;
  unit: string;
  status: string;
  productName: string;
  evidenceImages: string | null;
  processedBy: string | null;
  processedAt: string | null;
  actualQuantity: string | null;
}

export interface ExchangeReturnRecordWithInput extends ExchangeReturnRecord {
  inputQuantity: string;
  submitting?: boolean;
  submitError?: string | null;
}

export interface ApiResponse {
  order: OrderDetail;
  items: OrderItem[];
  receipts: {
    id: number;
    orderId: string;
    productId: string;
    productName: string;
    operationType: string;
    quantity: number;
    reason: string;
    unit: string;
  }[];
}
