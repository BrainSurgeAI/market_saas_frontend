import { PriceEntryPage } from "../components/price-entry-page";
import { fetchRemoteData, getUserRoles } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export default async function PriceEntryRoute() {
  const userRoles = await getUserRoles();
  const { username, roles } = userRoles;
  
  const response = await fetchRemoteData({
    endpoint: `/users/${username}/product_prices`,
    method: 'GET',
    tags: ['product_prices'],
    revalidate: 0,
  });
  if (!response.success) {
    logger.error(`Failed to fetch product prices: ${response.error}`);
    return <div>Failed to fetch product prices</div>;
  }

  const data = response.data;

  return <PriceEntryPage products={data.data} userRoles={roles} />;
}