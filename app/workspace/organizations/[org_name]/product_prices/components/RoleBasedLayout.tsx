'use client'

import { usePermission } from "@/app/context/permission-context"
//import { PricerDashboard } from "./pricer-dashboard"
import { PriceStatus, Organization } from "@/app/models"
import { StatCard } from "./stat-card"
import { CheckCircle, ClipboardList, ClipboardX, AlertCircle } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

interface RoleBasedLayoutProps {
  pricesStatus: PriceStatus[]
  organization: Organization
}

// 审核员仪表板组件
function ReviewerDashboard({ productPrices }: { productPrices: PriceStatus[] }) {
  const router = useRouter();
  const params = useParams();
  const orgName = params.org_name as string;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">价格审核管理</h2>
        <p className="text-sm text-gray-500 mt-1">审核和管理产品价格</p>
      </div>

      {/* 审核统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="待审核"
          value={productPrices.reduce((acc, curr) => acc + curr.products_pending, 0)}
          icon={<ClipboardList className="h-5 w-5 text-orange-600" />}
          linkTo={`/workspace/organizations/${orgName}/product_prices/pending`}
        />
        <StatCard
          title="审核通过"
          value={productPrices.reduce((acc, curr) => acc + curr.products_approved, 0)}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          linkTo={`/workspace/organizations/${orgName}/product_prices/approved`}
        />
        <StatCard
          title="今日拒绝"
          value={productPrices.reduce((acc, curr) => acc + curr.products_rejected, 0)}
          icon={<ClipboardX className="h-5 w-5 text-red-600" />}
          linkTo={`/workspace/organizations/${orgName}/product_prices/rejected`}
        />
        {/* <StatCard
          title="待录入"
          value={productPrices.reduce((acc, curr) => acc + curr.products_without_price, 0)}
          icon={<AlertCircle className="h-5 w-5 text-blue-600" />}
          linkTo={`/workspace/organizations/${orgName}/product_prices/missing`}
        /> */}
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/workspace/organizations/${orgName}/product_prices/pending`)}
        >
          <div className="flex items-center">
            <ClipboardList className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">审核待审核价格</h3>
              <p className="text-sm text-gray-500">查看并审核待审核的价格</p>
            </div>
          </div>
        </div>

        <div
          className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/workspace/organizations/${orgName}/product_prices/published`)}
        >
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">查看已发布价格</h3>
              <p className="text-sm text-gray-500">查看已发布的价格列表</p>
            </div>
          </div>
        </div>

        <div
          className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/workspace/organizations/${orgName}/product_prices/rejected`)}
        >
          <div className="flex items-center">
            <ClipboardX className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">查看已拒绝价格</h3>
              <p className="text-sm text-gray-500">查看已拒绝的价格列表</p>
            </div>
          </div>
        </div>
      </div>

      {/* 审核概览 */}
      {/* <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">各分类价格状态概览</h3>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品总数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">待审核</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">已通过</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">已拒绝</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">待录入</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productPrices.map((category) => (
                  <tr key={category.category_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.category_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.total_products}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {category.products_pending}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {category.products_published}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {category.products_rejected}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {category.products_without_price}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => router.push(`/workspace/organizations/${orgName}/product_prices/pending?category=${category.category_id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div> */}
    </div>
  )
}

// 价格录入员仪表板
function PricerDashboardWrapper({ productPrices, organization }: { productPrices: PriceStatus[], organization: Organization }) {
  const router = useRouter();
  const params = useParams();
  const orgName = organization?.nameHash || params.org_name as string;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">价格录入管理</h2>
        <p className="text-sm text-gray-500 mt-1">录入和管理产品价格</p>
      </div>

      {/* 录入统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="待录入"
          value={productPrices.reduce((acc, curr) => acc + curr.products_without_price, 0)}
          icon={<AlertCircle className="h-5 w-5 text-blue-600" />}
          linkTo={`/workspace/organizations/${orgName}/product_prices/entry`}
        />
        <StatCard
          title="已发布"
          value={productPrices.reduce((acc, curr) => acc + curr.products_published, 0)}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          linkTo={`/workspace/organizations/${orgName}/product_prices/published`}
        />
        <StatCard
          title="待审核"
          value={productPrices.reduce((acc, curr) => acc + curr.products_pending, 0)}
          icon={<ClipboardList className="h-5 w-5 text-orange-600" />}
          linkTo={`/workspace/organizations/${orgName}/product_prices/pending`}
        />
        <StatCard
          title="已拒绝"
          value={productPrices.reduce((acc, curr) => acc + curr.products_rejected, 0)}
          icon={<ClipboardX className="h-5 w-5 text-red-600" />}
          linkTo={`/workspace/organizations/${orgName}/product_prices/rejected`}
        />
      </div>

      {/* 快速操作 */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div
          className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/workspace/organizations/${orgName}/product_prices/entry`)}
        >
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">录入产品价格</h3>
              <p className="text-sm text-gray-500">为产品录入今日价格</p>
            </div>
          </div>
        </div>

        <div
          className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/workspace/organizations/${orgName}/product_prices/published`)}
        >
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">查看已录入价格</h3>
              <p className="text-sm text-gray-500">查看已录入的价格列表</p>
            </div>
          </div>
        </div>

        <div
          className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/workspace/organizations/${orgName}/product_prices/pending`)}
        >
          <div className="flex items-center">
            <ClipboardList className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">查看待审核价格</h3>
              <p className="text-sm text-gray-500">查看待审核的价格状态</p>
            </div>
          </div>
        </div>
      </div> */}

      {/* 价格录入界面 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">产品价格录入</h3>
        </div>
        <PricerDashboard productPrices={productPrices} isAuditor={false} /> */}
      </div>
    </div>
  );
}

export default function RoleBasedLayout({ pricesStatus: productPrices, organization }: RoleBasedLayoutProps) {
  const { userRole, hasPermission } = usePermission()

  if (hasPermission('PRICER')) {
    return <PricerDashboardWrapper productPrices={productPrices} organization={organization} />
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