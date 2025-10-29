import { fetchRemoteData } from "@/lib/api-utils";
import { Organization } from "@/app/models";
import { TenantsPage } from "../components/tenants-page";
import { Category } from "@/app/workspace/types";

export const dynamic = 'force-dynamic';

export default async function TenantManagementPage({ params }: { params: Promise<{ market_id: string }> }) {
  const { market_id } = await params;
  const response = await fetchRemoteData({ endpoint: `/tenants`, method: 'GET', tags: ['tenants'] });
  if (!response.success) {
    return <div>获取租户数据失败</div>;
  }

  const business_scope = await fetchRemoteData({
    endpoint: `/categories`,
    method: 'GET',
    tags: ['business_scope'],
    needToken: false,
  });

  if (!business_scope.success) {
    return <div>获取业务范围失败</div>;
  }

  const business_scope_data = business_scope.data.data as Category[];
  const tenants = response.data.data as Organization[];
  return <TenantsPage market_id={market_id} tenants={tenants} business_scope={business_scope_data} />;
}
