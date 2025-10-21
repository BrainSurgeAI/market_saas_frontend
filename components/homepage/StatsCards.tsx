import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react"
import { memo } from "react"

export interface StatsCardProps {
    stats: {
        total: number
        increased: number
        decreased: number
        unchanged: number
    }
}

const StatsCards = memo(function StatsCards({ stats }: StatsCardProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-2">当前分类产品总数</h3>
                <p className="text-xl font-bold text-gray-900 font-mono">{stats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-2">价格上浮</h3>
                <div className="flex items-center">
                    <p className="text-xl font-bold text-red-600 font-mono">{stats.increased}</p>
                    <TrendingUpIcon className="h-5 w-5 text-red-600 ml-2" />
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-2">价格下浮</h3>
                <div className="flex items-center">
                    <p className="text-xl font-bold text-green-600 font-mono">{stats.decreased}</p>
                    <TrendingDownIcon className="h-5 w-5 text-green-600 ml-2" />
                </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-2">价格持平</h3>
                <div className="flex items-center">
                    <p className="text-xl font-bold text-blue-600 font-mono">{stats.unchanged}</p>
                    <MinusIcon className="h-5 w-5 text-blue-600 ml-2" />
                </div>
            </div>
        </div>
    )
});

export default StatsCards; 