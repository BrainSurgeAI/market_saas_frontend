import { PermissionProvider, UserRole } from "@/app/context/permission-context";
import RoleBasedLayout from "@/app/workspace/organizations/[org_name]/product_prices/components/RoleBasedLayout";

import { logger } from "@/lib/logger";
import { fetchRemoteData, getUserRoles } from "@/lib/api-utils";

export default async function PriceManagePage() {  
  const decoded = await getUserRoles();
  const { username, roles } = decoded;

  const response = await fetchRemoteData({
    endpoint: `/users/${username}/product_price_status_stats`,
    method: 'GET',
    tags: ['product_price_status_stats'],
    revalidate: 0,
  });

  if (!response.success) {
    logger.error(`Failed to fetch product price status stats: ${response.error}`);
    return <div>Failed to fetch product price status stats</div>;
  }

  const data = response.data;
  const primaryRole = roles && roles.length > 0 ? roles[0] : 'Guest';
  
  return (
    <PermissionProvider initialRole={primaryRole as UserRole}>
      <RoleBasedLayout pricesStatus={data.data} />
    </PermissionProvider>
  );
}