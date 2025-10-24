/**
 * 组件统一导出文件
 */

// UI Components (shadcn/ui)
export * from './ui/button'
export * from './ui/card'
export * from './ui/table'
export * from './ui/pagination'
export * from './ui/select'
export * from './ui/input'
export * from './ui/label'
export * from './ui/textarea'
export * from './ui/dialog'
export * from './ui/dropdown-menu'
export * from './ui/tooltip'
export * from './ui/toast'
export * from './ui/toaster'
export * from './ui/badge'
export * from './ui/avatar'
export * from './ui/breadcrumb'
export * from './ui/alert'
export * from './ui/alert-dialog'
export * from './ui/checkbox'
export * from './ui/collapsible'
export * from './ui/form'
export * from './ui/popover'
export * from './ui/scroll-area'
export * from './ui/separator'
export * from './ui/sheet'
export * from './ui/skeleton'
export * from './ui/sidebar'
export * from './ui/tabs'
export * from './ui/chart'

// Shared Components
export { LoadingOverlay } from './shared/LoadingOverlay'

// Feature Components - Dashboard
export {
  StatsCards,
  type StatsCardsProps,
  type ProductStats
} from './features/dashboard/StatsCards'

export {
  CustomPagination,
  type CustomPaginationProps
} from './features/dashboard/CustomPagination'

export {
  ProductTable
} from './features/dashboard/ProductTable'
export type {
  ProductTableProps
} from './features/dashboard/types'

export {
  PriceChangeIndicator,
  type PriceChangeIndicatorProps
} from './features/dashboard/PriceChangeIndicator'

export {
  SearchSidebar
} from './features/dashboard/SearchSidebar'

export {
  PriceAnnouncements
} from './features/dashboard/PriceAnnouncements'

export type {
  SortConfig,
  ColumnWidths
} from './features/dashboard/types'

// Re-export types for backward compatibility
export type {
  MenuItem,
  SubMenuItem,
  ProductStat as DashboardProductStats
} from '../types'