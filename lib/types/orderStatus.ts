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
  orderedQty: string;
  unitPrice: string;
  discountRate: string;
  discountedUnitPrice: string;
  netAmount: string;
  orderedAmount: string;
  processingRequirements: string | null;
  remark: string | null;
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

export interface Order {
  id: number;
  customerName: string;
  orderedAmount: string;
  discountAmount: string;
  netAmount: string;
  deliveryAddress: string;
  deliveryDate: string;
  orderStatus: string;
  shipperName: string;
  shipperPhone: string;
  receiverName: string;
  receiverPhone: string;
  createdAt: string;
  // 以下字段可能在某些场景下存在，但不在基础API响应中
  orderCode?: string;
  contactName?: string;
  contactPhone?: string;
  remark?: string | null;
  createdBy?: string;
  confirmBy?: string | null;
  confirmedAt?: string | null;
  cancelBy?: string | null;
  cancelledAt?: string | null;
  afterSaleAt?: string | null;
  rejectBy?: string | null;
  rejectedAt?: string | null;
  rejectReason?: string | null;
  completedBy?: string | null;
  deliveryStaffName?: string | null;
  deliveryStaffPhone?: string | null;
  providerName?: string | null;
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

export interface InspectionItem {
  orderDetailId: number;
  inspectedQty?: string; // 第一轮验收使用
  quantity?: string; // 第二轮验收使用
  remark?: string;
}

export interface OrderInspection {
  inspectionId: number;
  inspectionRound: number;
  inspectedByType: string;
  inspectedById?: number;
  result?: string;
  inspectedAt?: string;
  parent_id?: number; // 第二轮验收的父验收ID
  items: InspectionItem[];
}

export interface DeliveryItem {
  id: number;
  orderDetailId: number;
  productCode: string;
  actualQty: string;
  unitPrice: string;
  subtotal: string;
  weightUnit: string;
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: number;
  assignmentId?: number;
  parentId?: number | null; // 第二轮配送的父配送ID
  deliveryRound: number;
  deliveryType: string;
  deliveredAt?: string; // 当 deliveryStatus 为 PREPARING 时可能不存在
  deliveredBy: string;
  deliveryStatus: string;
  deliveryContactNumber: string;
  createdAt: string;
  updatedAt: string;
  items: DeliveryItem[];
}

export interface StatusHistoryItem {
  toStatus: string;
  changeReason: string;
  createdAt: string;
}

export interface ReceiptItem {
  productId: string;
  productName: string;
  quantity: string;
  unit: string;
  reason: string;
}

export interface Receipt {
  id: number;
  inspectionId?: number;
  operationType: string;
  status: string;
  items: ReceiptItem[];
  createdAt: string;
}

export interface OrderDetailData {
  order: Order;
  items: OrderItem[];
  afterSales: Receipt[];
  inspections: OrderInspection[];
  deliveries: Delivery[];
  statusHistory?: StatusHistoryItem[];
}

export interface ApiResponse {
  code: number;
  message: string;
  data: OrderDetailData;
  requestId?: string;
  timestamp?: string;
}
