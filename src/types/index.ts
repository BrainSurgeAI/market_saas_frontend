/**
 * 统一类型导出文件
 */

// API 相关类型
export * from './api'

// 认证相关类型
export * from './auth'

// 菜单相关类型
export * from './menuTypes'

// 权限相关类型
export * from './permissionTypes'

// 角色相关类型
export * from './roleTypes'

// 对账相关类型
export * from './reconciliationTypes'

// 通用类型
export interface BaseEntity {
  id: string | number
  createdAt?: string
  updatedAt?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  requestId?: string
  timestamp?: string
}

// 表单相关类型
export interface FormFieldProps {
  name: string
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

// 导航相关类型
export interface NavigationItem {
  id: string
  title: string
  href: string
  icon?: React.ReactNode
  children?: NavigationItem[]
  isActive?: boolean
}

// 用户相关类型
export interface User {
  id: string
  username: string
  email?: string
  roles: string[]
  profile?: UserProfile
}

export interface UserProfile {
  firstName?: string
  lastName?: string
  avatar?: string
  phone?: string
  organization?: string
}

// 组织相关类型
export interface Organization {
  id: string
  name: string
  nameHash: string
  description?: string
  logo?: string
  settings?: OrganizationSettings
}

export interface OrganizationSettings {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
}

// 分页相关类型
export interface PaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
}

export interface PaginationActions {
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
}

// 排序相关类型
export interface SortConfig {
  key: string
  direction: 'asc' | 'desc' | null
}

export interface SortActions {
  setSort: (config: SortConfig) => void
  toggleSort: (key: string) => void
  clearSort: () => void
}

// 筛选相关类型
export interface FilterConfig {
  [key: string]: any
}

export interface FilterActions {
  setFilter: (key: string, value: any) => void
  clearFilter: (key: string) => void
  clearAllFilters: () => void
}

// 表格相关类型
export interface TableColumn<T = any> {
  key: keyof T
  title: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, record: T) => React.ReactNode
}

export interface TableState<T = any> {
  data: T[]
  loading: boolean
  pagination: PaginationState
  sort: SortConfig
  filter: FilterConfig
}

// 模态框相关类型
export interface ModalState {
  isOpen: boolean
  title?: string
  content?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface ModalActions {
  open: (content?: React.ReactNode, title?: string) => void
  close: () => void
  toggle: () => void
}

// 通知相关类型
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// 主题相关类型
export type Theme = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  theme: Theme
  primaryColor?: string
  borderRadius?: number
  fontSize?: 'sm' | 'md' | 'lg'
}

// 错误相关类型
export interface AppError {
  code: string | number
  message: string
  details?: any
  stack?: string
}

export interface ErrorBoundaryState {
  hasError: boolean
  error?: AppError
}

// 加载状态相关类型
export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

// 表单验证相关类型
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface FormFieldValidation {
  [fieldName: string]: ValidationRule
}

export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

// 文件上传相关类型
export interface FileUploadConfig {
  accept?: string[]
  maxSize?: number
  maxFiles?: number
  multiple?: boolean
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

// 搜索相关类型
export interface SearchState {
  query: string
  results: any[]
  loading: boolean
  suggestions: string[]
}

export interface SearchActions {
  setQuery: (query: string) => void
  search: (query: string) => Promise<void>
  clearResults: () => void
}

// 布局相关类型
export interface LayoutConfig {
  sidebar: {
    isOpen: boolean
    width: number
    collapsible: boolean
  }
  header: {
    height: number
    fixed: boolean
  }
  footer: {
    height: number
    fixed: boolean
  }
}

// 实用工具类型
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}