import { PriceAnnouncement } from "@/app/workspace/types"

export interface SortConfig {
    key: string
    direction: 'asc' | 'desc' | null
}

export interface ColumnWidths {
    category: string
    name: string
    unit: string
    price: string
    change: string
}

export interface ProductTableProps {
    products: PriceAnnouncement[]
    sortConfig: SortConfig
    onSort: (key: string) => void
    columnWidths?: ColumnWidths
}

export interface SortableHeaderProps {
    title: string
    sortKey: string
    sortConfig: SortConfig
    onSort: (key: string) => void
    className?: string
}