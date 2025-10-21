import { PriceAnnouncement } from "@/app/workspace/types"
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
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"


interface ProductTableProps {
  products: PriceAnnouncement[]
  sortConfig: {
    key: string
    direction: 'asc' | 'desc' | null
  }
  onSort: (key: string) => void
}

// 价格变化显示组件
const PriceChangeIndicator = ({ priceChange }: { priceChange: string }) => {
  const value = parseFloat(priceChange)
  
  if (value === 0) {
    return (
      <div className="inline-flex items-center justify-center">
        <span className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
          -
        </span>
      </div>
    )
  }

  return (
    <div className="group relative inline-flex items-center justify-center">
      <div className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${value > 0 
          ? 'text-red-700 bg-red-50' 
          : 'text-emerald-700 bg-emerald-50'}
      `}>
        {value > 0 ? (
          <TrendingUpIcon className="h-4 w-4" />
        ) : (
          <TrendingDownIcon className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {value > 0 ? '涨' : '跌'}
        </span>
      </div>
      
      {/* 悬停提示 */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className={`
          text-white text-xs rounded-lg py-2 px-3 shadow-lg
          ${value > 0 ? 'bg-red-500' : 'bg-emerald-600'}
        `}>
          <div className="font-medium">
            {value > 0 ? '涨' : '跌'}
          </div>
          <div className="font-mono">
            {/* {Math.abs(value).toFixed(2)} */}
            {value}
          </div>
          {/* 小三角形 */}
          <div className={`
            absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent
            ${value > 0 ? 'border-t-red-500' : 'border-t-emerald-500'}
          `} />
        </div>
      </div>
    </div>
  )
}

const formatPrice = (price: string) => {
  return (
    <span className="inline-flex items-baseline font-mono tabular-nums">
      <span className="text-sm font-sm text-gray-500"></span>
      <span className="text-xs font-semibold">{Number(price).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}</span>
    </span>
  )
}

export function ProductTable({ products, sortConfig, onSort }: ProductTableProps) {
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
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

  // 定义列宽，确保表头和内容列宽一致
  const columnWidths = {
    category: "w-32",
    name: "w-48",
    unit: "w-16",
    price: "w-24",
    change: "w-24"
  };

  return (
    <div className="relative overflow-hidden border rounded-md">
      {/* 使用单一表格，固定表头 */}
      <div className="overflow-auto max-h-[calc(100vh-250px)]">
        <Table>
          <TableHeader className="sticky top-0 z-30 bg-blue-50 shadow-sm">
            <TableRow className="text-xs border-b hover:bg-transparent">
              <TableHead className={`h-10 text-blue-900 ${columnWidths.category}`}>分类</TableHead>
              <TableHead className={`h-10 text-blue-900 ${columnWidths.name}`}>产品名称</TableHead>
              <TableHead className={`h-10 text-blue-900 ${columnWidths.unit}`}>单位</TableHead>
              <TableHead 
                className={`h-10 text-right text-blue-900 ${columnWidths.price}`}
              >
                <button 
                  className="inline-flex items-center w-full justify-end cursor-pointer hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSort('max_price');
                  }}
                >
                  最高价
                  {getSortIcon('max_price')}
                </button>
              </TableHead>
              <TableHead 
                className={`h-10 text-center text-blue-900 ${columnWidths.change}`}
              >
                <button 
                  className="inline-flex items-center w-full justify-center cursor-pointer hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSort('max_price_change');
                  }}
                >
                  浮动
                  {getSortIcon('max_price_change')}
                </button>
              </TableHead>
              <TableHead 
                className={`h-10 text-right text-blue-900 ${columnWidths.price}`}
              >
                <button 
                  className="inline-flex items-center w-full justify-end cursor-pointer hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSort('avg_price');
                  }}
                >
                  中间价
                  {getSortIcon('avg_price')}
                </button>
              </TableHead>
              <TableHead 
                className={`h-10 text-center text-blue-900 ${columnWidths.change}`}
              >
                <button 
                  className="inline-flex items-center w-full justify-center cursor-pointer hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSort('avg_price_change');
                  }}
                >
                  浮动
                  {getSortIcon('avg_price_change')}
                </button>
              </TableHead>
              <TableHead 
                className={`h-10 text-right text-blue-900 ${columnWidths.price}`}
              >
                <button 
                  className="inline-flex items-center w-full justify-end cursor-pointer hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSort('min_price');
                  }}
                >
                  最低价
                  {getSortIcon('min_price')}
                </button>
              </TableHead>
              <TableHead 
                className={`h-10 text-center text-blue-900 ${columnWidths.change}`}
              >
                <button 
                  className="inline-flex items-center w-full justify-center cursor-pointer hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSort('min_price_change');
                  }}
                >
                  浮动
                  {getSortIcon('min_price_change')}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow
                key={index}
                className={`text-xs ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}`}
              >
                <TableCell className={`font-medium text-blue-900 ${columnWidths.category}`}>{product.levelOneCategory}</TableCell>
                <TableCell className={`text-blue-800 ${columnWidths.name}`}>{product.productName}</TableCell>
                <TableCell className={`text-blue-800 ${columnWidths.unit}`}>{product.unit}</TableCell>
                <TableCell className={`text-right text-blue-900 ${columnWidths.price}`}>{formatPrice(product.maxPrice)}</TableCell>
                <TableCell className={`text-center ${columnWidths.change}`}>
                  <PriceChangeIndicator priceChange={product.maxPriceChange} />
                </TableCell>
                <TableCell className={`text-right font-medium text-blue-900 ${columnWidths.price}`}>{formatPrice(product.avgPrice)}</TableCell>
                <TableCell className={`text-center ${columnWidths.change}`}>
                  <PriceChangeIndicator priceChange={product.avgPriceChange} />
                </TableCell>
                <TableCell className={`text-right font-medium text-blue-900 ${columnWidths.price}`}>{formatPrice(product.minPrice)}</TableCell>
                <TableCell className={`text-center ${columnWidths.change}`}>
                  <PriceChangeIndicator priceChange={product.minPriceChange} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-muted/50">
            <TableRow>
              <TableCell colSpan={9} className="text-right text-xs text-blue-600">
               
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}