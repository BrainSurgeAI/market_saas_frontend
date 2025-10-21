import {  UserRole } from "@/app/context/permission-context";
import { logger } from "@/lib/logger";
import { fetchRemoteData, getUserRoles } from "@/lib/api-utils";


// 状态映射，将URL参数映射到API状态值
const STATUS_MAP: Record<string, string> = {
  'pending': 'PENDING',
  'entry': 'PENDING',  // 'entry'也映射到待处理
  'published': 'PUBLISHED',
  'rejected': 'REJECTED'
};

// 状态显示名称映射
const STATUS_DISPLAY: Record<string, string> = {
  'pending': '待审核产品',
  'entry': '待录入产品',
  'published': '已发布产品',
  'rejected': '已拒绝产品'
};

// 修改组件签名，使用明确的类型
export default async function ProductsByStatusPage({
  params,
}: {
  params: Promise<{ org_name: string; status: string }>
}) {
  // 从params直接获取数据
  const { org_name, status } = await params;
  
  // 获取用户信息
  const decoded = await getUserRoles();
  const { username, roles } = decoded;
  
  // 获取API状态值
  const apiStatus = STATUS_MAP[status] || 'PENDING';
  
  let data;
  try {
    const response = await fetchRemoteData({
      endpoint: `/users/${username}/product_prices?status=${apiStatus}`, 
      method: 'GET', 
      tags: [`product_prices_${apiStatus.toLowerCase()}`]
    });

    if (!response.success) {
      throw new Error('No data returned from API');
    }

    data = response.data;
    console.log(JSON.stringify(data));
  } catch (error) {
    logger.error(`Failed to fetch ${apiStatus} products: ${error}`);
    data = { data: [] };
  }

  const primaryRole = roles && roles.length > 0 ? roles[0] : 'Guest';
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">
          {STATUS_DISPLAY[status] || '产品列表'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          当前显示: {data.data.length} 个产品
        </p>
      </div>
      
      <ProductStatusWrapper 
        products={data.data} 
        status={apiStatus} 
        orgName={org_name}
        userRole={primaryRole as UserRole}
      />
    </div>
  );
}

// 客户端包装组件，单独导出到单独文件
import ProductStatusWrapper from './ProductStatusWrapper'; 