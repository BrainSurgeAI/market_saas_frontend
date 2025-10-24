'use client'

import { TrendingDown, TrendingUp } from "lucide-react"
import { memo } from "react"

export interface PriceChangeIndicatorProps {
    priceChange: string
    showTooltip?: boolean
}

export const PriceChangeIndicator = memo(function PriceChangeIndicator({
    priceChange,
    showTooltip = true
}: PriceChangeIndicatorProps) {
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

    const isPositive = value > 0
    const bgColor = isPositive ? 'bg-red-50' : 'bg-emerald-50'
    const textColor = isPositive ? 'text-red-700' : 'text-emerald-700'
    const tooltipBg = isPositive ? 'bg-red-500' : 'bg-emerald-600'
    const triangleBorder = isPositive ? 'border-t-red-500' : 'border-t-emerald-500'
    const IconComponent = isPositive ? TrendingUp : TrendingDown
    const label = isPositive ? '涨' : '跌'

    return (
        <div className={`group relative inline-flex items-center justify-center`}>
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
            </div>

            {/* 悬停提示 */}
            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className={`text-white text-xs rounded-lg py-2 px-3 shadow-lg ${tooltipBg}`}>
                        <div className="font-medium">{label}</div>
                        <div className="font-mono">{value}</div>
                        {/* 小三角形 */}
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${triangleBorder}`} />
                    </div>
                </div>
            )}
        </div>
    )
})

PriceChangeIndicator.displayName = 'PriceChangeIndicator'