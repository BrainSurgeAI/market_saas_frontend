import { fetchRemoteData } from "@/lib/api-utils";
import { TenantDetails } from "../components/TenantDetails";
import { notFound } from "next/navigation";

export default async function TenantDetailsPage({
  params
}: {
  params: Promise<{ market_id: string; tenant_hash: string }>
}) {
  const { market_id, tenant_hash } = await params;
  try {
    const response = await fetchRemoteData({ endpoint: `/tenants/${tenant_hash}`, method: 'GET', tags: [], revalidate: 0 });

    // 如果没有数据，返回404
    if (!response || !response.data || response.status !== 200) {
      return notFound();
    }

    const tenant = response.data.data;

    // 确保日期字段以统一格式处理
    if (tenant.createdAt && typeof tenant.createdAt === 'string') {
      tenant.createdAt = new Date(tenant.createdAt).getTime();
    }
    if (tenant.updatedAt && typeof tenant.updatedAt === 'string') {
      tenant.updatedAt = new Date(tenant.updatedAt).getTime();
    }
    if (tenant.verifiedAt && typeof tenant.verifiedAt === 'string') {
      tenant.verifiedAt = new Date(tenant.verifiedAt).getTime();
    }

    // 渲染详情页面
    return <TenantDetails tenant={tenant} market_id={market_id} />;
  } catch (error) {
    console.error("Failed to fetch tenant details:", error);
    return notFound();
  }
}
