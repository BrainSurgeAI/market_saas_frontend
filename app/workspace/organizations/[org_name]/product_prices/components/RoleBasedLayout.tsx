'use client'

import { usePermission } from "@/app/context/permission-context"
import { PricerDashboard } from "./pricer-dashboard"
import { PriceStatus } from "@/app/models"
import { StatCard } from "./stat-card"
import { CheckCircle, ClipboardList, ClipboardX } from "lucide-react"
import { useParams } from "next/navigation"

interface RoleBasedLayoutProps {
  pricesStatus: PriceStatus[]
}

// 审核员仪表板组件
function ReviewerDashboard({ productPrices }: { productPrices: PriceStatus[] }) {
  // 获取当前组织名称
  const params = useParams();
  const orgName = params.org_name as string;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">产品价格审核</h2>
      </div>
      
      {/* 审核统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="待审核"
            value={productPrices.reduce((acc, curr) => acc + curr.products_pending, 0)}
            icon={<ClipboardList className="h-5 w-5 text-primary" />}
            linkTo={`/workspace/organizations/${orgName}/product_prices/entry`}
          //trend={5} 
          />
          <StatCard
            title="审核通过"
            value={productPrices.reduce((acc, curr) => acc + curr.products_published, 0)}
            icon={<CheckCircle className="h-5 w-5 text-primary" />}
            linkTo={`/workspace/organizations/${orgName}/product_prices/published`}
          //trend={-2}
          />
           <StatCard
            title="今日拒绝"
            value={productPrices.reduce((acc, curr) => acc + curr.products_rejected, 0)}
            icon={<ClipboardX className="h-5 w-5 text-primary" />}
            linkTo={`/workspace/organizations/${orgName}/product_prices/rejected`}
          //trend={15}
          />
        </div>
             
      
      {/* 审核表格 - 可以复用 PricerDashboard 的表格，但添加审核操作 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">待审核产品列表</h3>
        </div>
        <PricerDashboard productPrices={productPrices} isAuditor={true} />
      </div>
    </div>
  )
}

// 价格录入员仪表板
function PricerDashboardWrapper({ productPrices }: { productPrices: PriceStatus[] }) {

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <PricerDashboard productPrices={productPrices} />
      </div>
    </div>
  );
}

export default function RoleBasedLayout({ pricesStatus: productPrices }: RoleBasedLayoutProps) {
  const { userRole, hasPermission } = usePermission()
  
  if (hasPermission('PRICER')) {
    return <PricerDashboardWrapper productPrices={productPrices} />
  }
  
  if (hasPermission('AUDITOR')) {
    return <ReviewerDashboard productPrices={productPrices} />
  }
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">权限不足</h1>
        <p className="text-gray-600">您没有访问此页面的权限。请联系管理员。</p>
        <p className="text-sm text-gray-500 mt-2">当前角色: {userRole}</p>
      </div>
    </div>
  )
} 