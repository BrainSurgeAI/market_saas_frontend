/**
 * API 相关类型定义
 */

// 通用 API 响应类型
export interface BaseApiResponse<T = any> {
  code: number
  message: string
  data: T
  requestId?: string
  timestamp?: string
}

// 分页 API 响应类型
export interface PaginatedApiResponse<T> extends BaseApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// API 错误响应类型
export interface ApiErrorResponse {
  code: number
  message: string
  error?: string
  details?: Record<string, any>
  requestId?: string
  timestamp?: string
}

// HTTP 方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// API 请求配置类型
export interface ApiRequestConfig {
  method?: HttpMethod
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  timeout?: number
  retries?: number
  cache?: RequestCache
}

// API 客户端配置类型
export interface ApiClientConfig {
  baseURL: string
  timeout?: number
  retries?: number
  headers?: Record<string, string>
  interceptors?: {
    request?: (config: ApiRequestConfig) => ApiRequestConfig
    response?: (response: Response) => Response
    error?: (error: Error) => Error
  }
}

// 用户相关 API 类型
export interface LoginRequest {
  username: string
  password: string
  rememberMe?: boolean
}

export interface ApiLoginResponse {
  user: {
    id: string
    username: string
    email?: string
    roles: string[]
    profile?: UserProfile
  }
  token: string
  refreshToken: string
  expiresIn: number
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  confirmPassword: string
  firstName?: string
  lastName?: string
}

export interface UserProfile {
  id: string
  username: string
  email?: string
  firstName?: string
  lastName?: string
  avatar?: string
  phone?: string
  organization?: string
  roles: string[]
  preferences?: ApiUserPreferences
}

export interface ApiUserPreferences {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  notifications?: NotificationSettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
}

// 组织相关 API 类型
export interface Organization {
  id: string
  name: string
  nameHash: string
  description?: string
  logo?: string
  settings?: OrganizationSettings
  createdAt: string
  updatedAt: string
}

export interface OrganizationSettings {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  features?: Record<string, boolean>
}

// 菜单相关 API 类型
export interface ApiMenuConfigResponse {
  userRoles: string[]
  primaryRole: string
  menuConfig: {
    teams: MenuItemTeam[]
    navMain: ApiMenuItem[]
    projects: MenuItemProject[]
  }
}

export interface MenuItemTeam {
  name: string
  logo: { name: string }
  plan: string
}

export interface MenuItemProject {
  name: string
  url: string
  icon: { name: string }
}

export interface ApiMenuItem {
  title: string
  url: string
  icon: string | null
  id?: number
  is_active?: boolean
  items?: ApiSubMenuItem[]
}

export interface ApiSubMenuItem {
  title: string
  url: string
  icon?: string | null
  id?: number
  is_active?: boolean
}

// 角色权限相关 API 类型
export interface ApiRole {
  id: number
  name: string
  code: string
  description?: string
  priority: number
  isActive: boolean
  permissions?: ApiRolePermission[]
}

export interface ApiRolePermission {
  id: number
  name: string
  code: string
  description?: string
  resource: string
  action: string
}

// 产品相关 API 类型
export interface Product {
  id: string
  name: string
  code: string
  description?: string
  category: ProductCategory
  price?: ProductPrice
  images?: ProductImage[]
  status: 'active' | 'inactive' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface ProductCategory {
  id: string
  name: string
  code: string
  parentId?: string
  level: number
  children?: ProductCategory[]
}

export interface ProductPrice {
  currency: string
  basePrice: number
  sellingPrice: number
  costPrice?: number
  validFrom: string
  validTo?: string
}

export interface ProductImage {
  id: string
  url: string
  alt?: string
  width?: number
  height?: number
  size?: number
  type?: string
}

// 订单相关 API 类型
export interface Order {
  id: string
  code: string
  customer: OrderCustomer
  items: OrderItem[]
  status: OrderStatus
  totalAmount: number
  currency: string
  createdAt: string
  updatedAt: string
  deliveryInfo?: DeliveryInfo
  paymentInfo?: PaymentInfo
}

export interface OrderCustomer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: Address
}

export interface OrderItem {
  id: string
  product: Product
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface DeliveryInfo {
  method: 'pickup' | 'delivery'
  address?: Address
  scheduledDate?: string
  trackingNumber?: string
  status?: DeliveryStatus
}

export type DeliveryStatus =
  | 'pending'
  | 'preparing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'

export interface PaymentInfo {
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  currency: string
  paidAt?: string
  transactionId?: string
}

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'bank_transfer'
  | 'digital_wallet'
  | 'credit'

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'

export interface Address {
  street: string
  city: string
  state?: string
  postalCode: string
  country: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

// 文件上传相关 API 类型
export interface UploadRequest {
  file: File
  type?: string
  category?: string
  metadata?: Record<string, any>
}

export interface UploadResponse {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  metadata?: Record<string, any>
  uploadedAt: string
}

// 搜索相关 API 类型
export interface SearchRequest {
  query: string
  type?: string
  filters?: Record<string, any>
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  pagination?: {
    page: number
    pageSize: number
  }
}

export interface SearchResponse<T> {
  results: T[]
  total: number
  page: number
  pageSize: number
  suggestions?: string[]
  facets?: Record<string, SearchFacet>
}

export interface SearchFacet {
  field: string
  values: SearchFacetValue[]
}

export interface SearchFacetValue {
  value: string
  count: number
  selected?: boolean
}

// 统计相关 API 类型
export interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
  totalProducts: number
  recentOrders: Order[]
  topProducts: ProductStat[]
  revenueByPeriod: RevenueStat[]
}

export interface ProductStat {
  product: Product
  totalSold: number
  revenue: number
  growth?: number
}

export interface RevenueStat {
  period: string
  revenue: number
  orders: number
  growth?: number
}

// 通知相关 API 类型
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  readAt?: string
  createdAt: string
  expiresAt?: string
}

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'system'
  | 'order'
  | 'payment'
  | 'delivery'

// WebSocket 消息类型
export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: string
  id?: string
}

export interface OrderUpdateMessage extends WebSocketMessage {
  type: 'order_update'
  payload: {
    orderId: string
    status: OrderStatus
    updateType: 'status_change' | 'item_added' | 'item_removed' | 'info_updated'
  }
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'notification'
  payload: Notification
}