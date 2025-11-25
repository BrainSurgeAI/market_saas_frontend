import { MarketOrderData, MarketOrderRound, MarketOrderItem, MarketRemark } from './marketOrder';

export interface CustomerRemark extends MarketRemark {}

export interface CustomerOrderItem extends MarketOrderItem {
  // Fields from new API response
  category?: string;
  discountRate?: string;
  discountedUnitPrice?: string;
  id?: number; // Maps to orderDetailId? or just id
  name?: string; // Maps to productName
  netAmount?: string;
  orderedAmount?: string;
  productId?: string; // Maps to productCode
}

export interface CustomerOrderRound extends MarketOrderRound {
  items: CustomerOrderItem[];
}

export interface CustomerOrderDetail {
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
}

export interface CustomerOrderData extends MarketOrderData {
  details: CustomerOrderDetail[];
  rounds: CustomerOrderRound[];
}

export interface CustomerOrderResponse {
  code: number;
  message: string;
  data: CustomerOrderData;
}
