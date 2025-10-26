import { PriceEntryPage } from "../components/price-entry-page";
import { fetchRemoteData, getUserRoles } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export default async function PriceEntryRoute() {
  const userRoles = await getUserRoles();
  const { username, roles } = userRoles;

  const endpoint = roles[0] == 'PRICER' ? '/product_prices' : '/product_prices/status'
  const response = await fetchRemoteData({
    endpoint: `${endpoint}?page=1&page_size=10`,
    method: 'GET',
    tags: ['product_prices'],
    revalidate: 0,
  });

  if (!response.success) {
    logger.error(`Failed to fetch product prices: ${response.error}`);
    console.error('API Error:', response.error);
    return <div>Failed to fetch product prices: {response.error}</div>;
  }

  // API返回的实际数据结构是嵌套的
  const data = response.data;
  console.log('API Data:', data);

  if (!data) {
    return <div>No data received from API</div>;
  }

  // 产品数组在 data.data.data 中，分页信息在 data.data 中
  const innerData = data.data;
  console.log('Inner data (data.data):', innerData);

  const productsArray = Array.isArray(innerData?.data) ? innerData.data : [];
  const paginationData = {
    total: innerData?.total || 0,
    page: innerData?.page || 1,
    page_size: innerData?.page_size || 10
  };

  console.log('Products array length:', productsArray.length);
  console.log('First product:', productsArray[0]);
  console.log('Pagination info:', paginationData);

  if (productsArray.length === 0) {
    console.warn('No products found in API response');
  }

  return <PriceEntryPage
    products={productsArray}
    pagination={paginationData}
    userRoles={roles}
  />;
}