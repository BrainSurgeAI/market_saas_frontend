// 定义产品类型
export interface Product {
  id: string;
  name: string;
  category: string;
  price?: number;
  discountRate?: number;
  minPrice?: number;
  maxPrice?: number;
  unit: string;
  stock?: number;
  image: string;
  categoryId: number;
  isDisabled: boolean;
  minOrderQuantity: number;
}

// 首页价格公示
export interface PriceAnnouncement {
  productCode: string
  levelOneCategory: string
  levelThreeCategory: string
  productName: string
  minPrice: string
  minPriceChange: string
  avgPrice: string
  avgPriceChange: string
  maxPrice: string
  maxPriceChange: string
  unit: string
  status: string
  priceDate: string
}

// 定义购物车项类型
export interface CartItem {
  //id: number;
  productId: string;
  productCode?: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  unit: string;
  total: number;
  originalTotal: number;
  discountRate: number;
  category: string;
  categoryId: number;
  image?: string;
  processingServices?: {
    type: string;
    description?: string;
  }[];
  customNote?: string;
  minOrderQuantity?: number;
  uniqueId?: string;
}

// 定义产品详情类型
export interface ProductDetail extends Product {
  id: string;
  description?: string;
  specialNotes?: string;
  tips?: string;
  brand?: string;
  storageConditions?: string;
  shelfLife?: string;
  pricingMethod?: string;
  spec?: string;
  taxRate?: number;
}

export interface ProcessingFee {
  processingFeeId: number;
  processingType: string;
  feeType: string;
  feeValue: number;
  description: string;
  isCheckbox: boolean;
  isDefault: boolean;
}

export interface ProductDetailResponse {
  product: ProductDetail;
  processingFees: ProcessingFee[];
}


export interface OrderOverview {
  orderCode: string;
  totalAmount: string;
  actualAmount: string;
  deliveryDate: string;
  deliveryAddress: string;
  orderStatus: string;
  createdAt: string;
  marketName: string;
  marketAddress: string;
  customerName: string;
  customerAddress: string;
  contactName: string;
  contactPhone: string;
  marketContactNumber: string | null;
  marketContactorName: string | null;
  shipperName: string | null;
  shipperPhone: string | null;
  skuCount: number;
  urgent: boolean;
  items?: OrderItem[]; // Making items optional as it's not in the provided JSON sample but might be needed elsewhere
  // assignedTo?: string | null;
  // afterSaleAt?: string | null;
}

// 定义订单类型
export interface Order {
  id: string;
  date: string;
  status: "已完成" | "处理中" | "已取消";
  totalAmount: number;
  items: OrderItem[];
}

// 定义订单项类型
export interface OrderItem {
  productId: string;
  name: string;
  category: string;
  categoryId: number;
  quantity: number;
  price: number;
  discountRate: number;
  actualPrice: number;
  unit: string;
  total: number;
  processing_requirements?: string;
  remark?: string;
}

export type Category = {
  id: number;
  level_one_category: string;
  level_two_category: string;
}


export type CategoryWithSubCategories = {
  id: number;
  category: string;
  subCategories: SubCategory[];
}

export type SubCategory = {
  id: number;
  name: string;
}

export interface AfterSaleOrder {
  orderCode: string;
  orderStatus: string;
  acceptedAt: string;
}