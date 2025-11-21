// PROVIDER 订单详情专用类型定义

export interface ProviderOrderItem {
  acceptedQty: string | null;
  actualQty: string | null;
  categoryId: number;
  categoryName: string;
  exchangeQty: string | null;
  inspectionStatus: 'SIGN' | 'RETURN' | 'EXCHANGE' | 'PENDING' | null;
  needToDeliverQty: string;
  orderDetailId: number;
  processingRequirements: string | null;
  productCode: string;
  productName: string;
  remark: {
    evidenceImages: string[] | null;
    reason: string;
  } | null;
  unit: string;
  unitPrice: string;
}

export interface ProviderOrderRound {
  deliveryStatus: string;
  deliveryType: 'NORMAL' | 'EXCHANGE';
  items: ProviderOrderItem[];
  round: number;
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
  rounds: ProviderOrderRound[];
  shipperName: string;
  shipperPhone: string;
}

export interface ProviderOrderResponse {
  code: number;
  message: string;
  data: ProviderOrderData;
  requestId: string;
  timestamp: string;
}
