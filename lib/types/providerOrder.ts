// PROVIDER 订单详情专用类型定义

export interface ProviderOrderItem {
  actualQty: string | null;
  categoryId: number;
  categoryName: string;
  lastInspectionResult: string;
  needToDeliverQty: string;
  orderDetailId: number;
  imageUrl: string | null;
  processingRequirements: string | null;
  productCode: string;
  productName: string;
  remark: string | null;
  unit: string;
  unitPrice: string;
}

export interface ProviderOrderCurrent {
  deliveryStatus: string;
  deliveryType: string;
  items: ProviderOrderItem[];
}

// 可共享给所有用户类型的字段
export interface SharedOrderData {
  createdAt: string;
  customerName: string;
  deliveryAddress: string;
  deliveryDate: string;
  discountAmount: string;
  netAmount: string;
  orderCode: string;
  orderStatus: string;
  orderedAmount: string;
  receiverName: string;
  receiverPhone: string;
 
}

// PROVIDER专用的完整数据（包含共享字段 + PROVIDER特有字段）
export interface ProviderOrderData extends SharedOrderData {
  current: ProviderOrderCurrent;
  shipperName: string | null;
  shipperPhone: string | null;
  marketContactorName: string | null;
  marketContactNumber: string | null;
}

// 配送历史相关类型
export interface DeliveryStaff {
  id: string;
  name: string;
  phone: string;
}

export interface DeliveryHistoryItem {
  orderDetailId: number;
  productCode: string;
  productName: string;
  categoryId: number;
  categoryName: string;
  unit: string;
  unitPrice: string;
  orderedQty: string;
  needToDeliverQty: string;
  actualQty: string;
  lastInspectionResult: string;
  inspectionAt: string | null;
  remark: string | null;
  inspectedQty: string | null;
}

export interface DeliveryRound {
  round: number;
  deliveryType: 'NORMAL' | 'EXCHANGE';
  deliveryStatus: string;
  inspectionStatus: string;
  deliveredAt: string;
  inspectedAt: string | null;
  deliveryStaff?: DeliveryStaff;
  items: DeliveryHistoryItem[];
}

export interface DeliveryHistoryData {
  orderCode: string;
  history: DeliveryRound[];
}

export interface ProviderOrderResponse {
  code: number;
  message: string;
  data: ProviderOrderData;
  requestId: string;
  timestamp: string;
}

export interface DeliveryHistoryResponse {
  code: number;
  message: string;
  data: DeliveryHistoryData;
  requestId: string;
  timestamp: string;
}
