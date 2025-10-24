'use client'

import React, { memo, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline"
import { PriceChangeIndicator } from "./PriceChangeIndicator"
import { formatPrice } from "@/utils/price"
import type { ProductTableProps, ColumnWidths, SortableHeaderProps } from "./types"

// 默认列宽配置
const defaultColumnWidths: ColumnWidths = {
    category: "w-32",
    name: "w-48",
    unit: "w-16",
    price: "w-24",
    change: "w-24"
}

// 可排序表头组件
const SortableHeader = memo(function SortableHeader({
    title,
    sortKey,
    sortConfig,
    onSort,
    className = ""
}: SortableHeaderProps) {
    const getSortIcon = () => {
        if (sortConfig.key !== sortKey) {
            return <ChevronUpDownIcon className="h-4 w-4 inline-block ml-1" />
        }
        if (sortConfig.direction === 'asc') {
            return <ChevronUpIcon className="h-4 w-4 inline-block ml-1 text-blue-600" />
        }
        if (sortConfig.direction === 'desc') {
            return <ChevronDownIcon className="h-4 w-4 inline-block ml-1 text-blue-600" />
        }
        return <ChevronUpDownIcon className="h-4 w-4 inline-block ml-1" />
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onSort(sortKey)
    }

    return (
        <button
            className="inline-flex items-center w-full justify-end cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleClick}
        >
            {title}
            {getSortIcon()}
        </button>
    )
})

SortableHeader.displayName = 'SortableHeader'

export const ProductTable = memo(function ProductTable({
    products,
    sortConfig,
    onSort,
    columnWidths = defaultColumnWidths
}: ProductTableProps) {
    const tableHeaders = useMemo(() => [
        { key: 'category', title: '分类', align: 'left' },
        { key: 'name', title: '产品名称', align: 'left' },
        { key: 'unit', title: '单位', align: 'left' },
        { key: 'max_price', title: '最高价', align: 'right', sortable: true },
        { key: 'max_price_change', title: '浮动', align: 'center', sortable: true },
        { key: 'avg_price', title: '中间价', align: 'right', sortable: true },
        { key: 'avg_price_change', title: '浮动', align: 'center', sortable: true },
        { key: 'min_price', title: '最低价', align: 'right', sortable: true },
        { key: 'min_price_change', title: '浮动', align: 'center', sortable: true }
    ], [])

    const renderCell = (product: any, header: any) => {
        switch (header.key) {
            case 'category':
                return (
                    <TableCell className={`font-medium text-blue-900 ${columnWidths.category}`}>
                        {product.levelOneCategory}
                    </TableCell>
                )
            case 'name':
                return (
                    <TableCell className={`text-blue-800 ${columnWidths.name}`}>
                        {product.productName}
                    </TableCell>
                )
            case 'unit':
                return (
                    <TableCell className={`text-blue-800 ${columnWidths.unit}`}>
                        {product.unit}
                    </TableCell>
                )
            case 'max_price':
                return (
                    <TableCell className={`text-right text-blue-900 ${columnWidths.price}`}>
                        {formatPrice(product.maxPrice)}
                    </TableCell>
                )
            case 'max_price_change':
                return (
                    <TableCell className={`text-center ${columnWidths.change}`}>
                        <PriceChangeIndicator priceChange={product.maxPriceChange} />
                    </TableCell>
                )
            case 'avg_price':
                return (
                    <TableCell className={`text-right font-medium text-blue-900 ${columnWidths.price}`}>
                        {formatPrice(product.avgPrice)}
                    </TableCell>
                )
            case 'avg_price_change':
                return (
                    <TableCell className={`text-center ${columnWidths.change}`}>
                        <PriceChangeIndicator priceChange={product.avgPriceChange} />
                    </TableCell>
                )
            case 'min_price':
                return (
                    <TableCell className={`text-right font-medium text-blue-900 ${columnWidths.price}`}>
                        {formatPrice(product.minPrice)}
                    </TableCell>
                )
            case 'min_price_change':
                return (
                    <TableCell className={`text-center ${columnWidths.change}`}>
                        <PriceChangeIndicator priceChange={product.minPriceChange} />
                    </TableCell>
                )
            default:
                return null
        }
    }

    const renderHeader = (header: any) => {
        const baseClass = `h-10 text-blue-900 ${columnWidths[header.key as keyof ColumnWidths] || ''}`
        const alignClass = header.align === 'center' ? 'text-center' :
                           header.align === 'right' ? 'text-right' : 'text-left'

        if (header.sortable) {
            return (
                <TableHead className={`${baseClass} ${alignClass}`}>
                    <SortableHeader
                        title={header.title}
                        sortKey={header.key}
                        sortConfig={sortConfig}
                        onSort={onSort}
                    />
                </TableHead>
            )
        }

        return (
            <TableHead className={`${baseClass} ${alignClass}`}>
                {header.title}
            </TableHead>
        )
    }

    return (
        <div className="relative overflow-hidden border rounded-md">
            <div className="overflow-auto max-h-[calc(100vh-250px)]">
                <Table>
                    <TableHeader className="sticky top-0 z-30 bg-blue-50 shadow-sm">
                        <TableRow className="text-xs border-b hover:bg-transparent">
                            {tableHeaders.map((header) => (
                                <React.Fragment key={header.key}>
                                    {renderHeader(header)}
                                </React.Fragment>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product, index) => (
                            <TableRow
                                key={`${product.levelOneCategory}-${product.productName}-${index}`}
                                className={`text-xs ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}`}
                            >
                                {tableHeaders.map((header) => (
                                    <React.Fragment key={header.key}>
                                        {renderCell(product, header)}
                                    </React.Fragment>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter className="bg-muted/50">
                        <TableRow>
                            <TableCell colSpan={tableHeaders.length} className="text-right text-xs text-blue-600">
                                {/* 可以添加总计或其他统计信息 */}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </div>
        </div>
    )
})

ProductTable.displayName = 'ProductTable'