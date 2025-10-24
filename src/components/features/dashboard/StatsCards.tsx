'use client'

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { memo } from "react"

export interface ProductStats {
    total: number
    increased: number
    decreased: number
    unchanged: number
}

export interface StatsCardsProps {
    stats: ProductStats
}

interface StatCardProps {
    title: string
    value: number
    color: 'gray' | 'red' | 'green' | 'blue'
    icon?: React.ReactNode
}

const StatCard = memo(function StatCard({ title, value, color, icon }: StatCardProps) {
    const colorClasses = {
        gray: 'text-gray-900',
        red: 'text-red-600',
        green: 'text-green-600',
        blue: 'text-blue-600'
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
            <div className="flex items-center">
                <p className={`text-xl font-bold font-mono ${colorClasses[color]}`}>{value}</p>
                {icon && <span className="ml-2">{icon}</span>}
            </div>
        </div>
    )
})

StatCard.displayName = 'StatCard'

export const StatsCards = memo(function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
                title="当前分类产品总数"
                value={stats.total}
                color="gray"
            />
            <StatCard
                title="价格上浮"
                value={stats.increased}
                color="red"
                icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
                title="价格下浮"
                value={stats.decreased}
                color="green"
                icon={<TrendingDown className="h-5 w-5" />}
            />
            <StatCard
                title="价格持平"
                value={stats.unchanged}
                color="blue"
                icon={<Minus className="h-5 w-5" />}
            />
        </div>
    )
})

StatsCards.displayName = 'StatsCards' 