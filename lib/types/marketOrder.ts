export interface MarketRemark {
  evidenceImages: string | null;
  reason: string;
}

export interface MarketOrderItem {
  orderedQty: string;
  acceptedQty: string | null;
  needToInspectQty: string;
  categoryId: number;
  categoryName: string;
  exchangeQty: string | null;
  returnQty: string | null;
  inspectionStatus: "PENDING" | "SIGN" | "RETURN" | "EXCHANGE";
  orderDetailId: number;
  processingRequirements: string | null;
  productCode: string;
  productName: string;
  remark: MarketRemark | null;
  unit: string;
  unitPrice: string;
}

export interface MarketOrderRound {
  inspectionResult: string;
  inspectionAt: string | null;
  deliveryType: "NORMAL" | "EXCHANGE";
  deliveredAt: string;
  items: MarketOrderItem[];
  round: number;
}

export interface MarketOrderDetail {
  category: string;
  categoryId: number;
  discountRate: string;
  discountedUnitPrice: string;
  id: number;
  imageUrl: string | null;
  name: string;
  netAmount: string;
  orderedAmount: string;
  orderedQty: string;
  processingRequirements: string | null;
  productId: string;
  remark: string | null;
  unit: string;
  unitPrice: string;
  acceptedQty: string;
}

export interface MarketOrderData {
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
  shipperName: string;
  shipperPhone: string;
  details?: MarketOrderDetail[];
}

export interface MarketInspectionData {
  round: number;
  deliveryType: "NORMAL" | "EXCHANGE";
  deliveredAt: string;
  inspectionResult: string;
  inspectionAt: string | null;
  items: MarketInspectionItem[];
}

export interface MarketInspectionItem {
  inspectionItemId: number;
  productCode: string;
  productName: string;
  categoryId: number;
  categoryName: string;
  unit: string;
  discountRate: string;
  unitPrice: string;
  orderedQty: string;
  needToInspectQty: string;
  acceptedQty: string;
  inspectionStatus: "PENDING" | "SIGN" | "RETURN" | "EXCHANGE";
  processingRequirements: string | null;
}

export interface MarketInspectionResponse {
  code: number;
  message: string;
  data: MarketInspectionData;
}

export interface MarketOrderResponse {
  code: number;
  message: string;
  data: MarketOrderData;
}
