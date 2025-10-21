import { logger } from "@/lib/logger";
import ProductsTable from "./components/ProductsTable";
import { fetchRemoteData, getUserRoles } from "@/lib/api-utils";

export const dynamic = 'force-dynamic'

function getDefaultOverview(userRole: string) {
  return {
    products: [],
    total: 0,
    categories: [],
    userRole
  };
}

async function getProductsOverview() {
  const userRoles = await getUserRoles();
  const { tenant_hash, roles } = userRoles;
  const userRole = roles[0] || 'user';

  // 拉取分类数据
  const [categoriesResponse, productsResponse] = await Promise.all([
    fetchRemoteData({
      endpoint: '/categories',
      method: 'GET',
      tags: ['categories'],
      revalidate: 0,
    }),
    fetchRemoteData({
      endpoint: `/tenants/${tenant_hash}/products`,
      method: 'GET',
      tags: ['products'],
      revalidate: 0,
    }),
  ]);

  if (!categoriesResponse.success) {
    logger.error(`Failed to fetch categories: ${categoriesResponse.error}`);
    return getDefaultOverview(userRole);
  }

  if (!productsResponse.success) {
    logger.error(`Failed to fetch products: ${productsResponse.error}`);
    return getDefaultOverview(userRole);
  }

  return {
    products: productsResponse.data.data.products,
    total: productsResponse.data.data.total,
    categories: categoriesResponse.data.data,
    userRole
  };
}

export default async function ProductManagePage() {
  const { products, total, categories, userRole } = await getProductsOverview();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">产品管理</h1>
      <ProductsTable 
        initialProducts={products} 
        categories={categories}
        userRole={userRole}
        totalProducts={total}
      />
    </div>
  );
}