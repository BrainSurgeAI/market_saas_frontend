import { PermissionProvider, UserRole } from "@/app/context/permission-context";
import RoleBasedLayout from "@/app/workspace/organizations/[org_name]/product_prices/components/RoleBasedLayout";
import { Organization } from "@/app/models";

import { logger } from "@/lib/logger";
import { fetchRemoteData, getUserRoles } from "@/lib/api-utils";

interface PriceManagePageProps {
  organization: Organization;
}

export default async function PriceManagePage({ organization }: PriceManagePageProps) {  
  const decoded = await getUserRoles();
  const { username, roles } = decoded;

  console.log('PriceManagePage - organization:', organization?.nameHash);

  const response = await fetchRemoteData({
    endpoint: `/product_price_status_stats`,
    method: 'GET',
    tags: ['product_price_status_stats'],
    revalidate: 0,
  });

  if (!response.success) {
    logger.error(`User ${username} failed to fetch product price status stats: ${response.error}`);
    return <div>Failed to fetch product price status stats: {response.error}</div>;
  }

  const data = response.data;
  const primaryRole = roles && roles.length > 0 ? roles[0] : 'Guest';

  return (
    <PermissionProvider initialRole={primaryRole as UserRole}>
      <RoleBasedLayout pricesStatus={data.data || []} organization={organization} />
    </PermissionProvider>
  );
}