import { PermissionProvider, UserRole } from "@/app/context/permission-context";
import RoleBasedLayout from "@/app/workspace/organizations/[org_name]/product_prices/components/RoleBasedLayout";

import { logger } from "@/lib/logger";
import { fetchRemoteData, getUserRoles } from "@/lib/api-utils";

export default async function PriceManagePage() {  
  const decoded = await getUserRoles();
  const { username, roles } = decoded;

  console.log('🚀 开始获取产品价格统计数据...');
  console.log('👤 当前用户:', { username, roles });

  const response = await fetchRemoteData({
    endpoint: `/product_price_status_stats`,
    method: 'GET',
    tags: ['product_price_status_stats'],
    revalidate: 0,
  });

  console.log('📡 API响应:', {
    success: response.success,
    status: response.status,
    error: response.error,
    dataType: typeof response.data,
    rawData: response.data
  });

  if (!response.success) {
    logger.error(`User ${username} failed to fetch product price status stats: ${response.error}`);
    return <div>Failed to fetch product price status stats: {response.error}</div>;
  }

  const data = response.data;
  const primaryRole = roles && roles.length > 0 ? roles[0] : 'Guest';

  console.log('📊 产品价格统计数据:', {
    responseSuccess: response.success,
    dataType: typeof data,
    hasData: !!data,
    hasDataData: !!(data && data.data),
    dataData: data?.data,
    dataDataLength: Array.isArray(data?.data) ? data.data.length : 'not array',
    primaryRole
  });

  return (
    <PermissionProvider initialRole={primaryRole as UserRole}>
      <RoleBasedLayout pricesStatus={data.data || []} />
    </PermissionProvider>
  );
}