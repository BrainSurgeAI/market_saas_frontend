import { PriceEntryPage } from "../components/price-entry-page";
import { fetchRemoteData, getUserRoles } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export default async function PriceEntryRoute() {
  const userRoles = await getUserRoles();
  const { username, roles } = userRoles;

  console.log('PriceEntryRoute - user roles:', roles);

  const response = await fetchRemoteData({
    endpoint: `/product_prices?page=1&page_size=10`,
    method: 'GET',
    tags: ['product_prices'],
    revalidate: 0,
  });

  if (!response.success) {
    logger.error(`Failed to fetch product prices: ${response.error}`);
    return <div>Failed to fetch product prices: {response.error}</div>;
  }

  // API返回的实际数据结构是嵌套的
  const data = response.data;

  if (!data) {
    return <div>No data received from API</div>;
  }

  const innerData = data.data;

  const productsArray = Array.isArray(innerData?.data) ? innerData.data : [];
  const paginationData = {
    total: innerData?.total || 0,
    page: innerData?.page || 1,
    page_size: innerData?.page_size || 10
  };


  if (productsArray.length === 0) {
    console.warn('No products found in API response');
  }

  return <PriceEntryPage
    products={productsArray}
    pagination={paginationData}
    userRoles={roles}
  />;
}