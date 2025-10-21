import { logger } from "@/lib/logger";
import { ProcessingFee, ProductDetailResponse } from "@/app/workspace/types";
import ProductEditForm from "./components/ProductEditForm";
import { fetchRemoteData } from "@/lib/api-utils";

export const dynamic = 'force-dynamic'

async function getProductData(orgName: string, productCode: string) {
  try {
    const productResponse = await fetchRemoteData({
      endpoint: `/tenants/${orgName}/products/${productCode}`,
      method: 'GET',
      needToken: true,
      revalidate: 0
    });

    if (!productResponse.success) {
      throw new Error(`Failed to fetch product: ${productResponse.error}`);
    }

    const productData = productResponse.data.data;

    const processingFeesResponse = await fetchRemoteData ({
      endpoint: '/processing_fees',
      method: 'GET',
      needToken: true,
      revalidate: 0
    })

    if (!processingFeesResponse.success) {
      throw new Error(`Faild to fetch processing fees: ${processingFeesResponse.error}`);
    }

    return {
      product: productData as ProductDetailResponse,
      processingFees: processingFeesResponse.data.data as ProcessingFee[]
    };

  } catch (error) {
    logger.error('Error fetching product data:', error);
    return {
      product: null,
      processingFees: []
    }
  }
}

interface ProductPageProps {
  params: Promise<{
    org_name: string;
    product_code: string;
  }>;
}

export default async function ProductEditPage({ params }: ProductPageProps) {
  const { org_name, product_code } = await params;
  const { product, processingFees } = await getProductData(org_name, product_code);

  if (!product) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">产品不存在</h2>
            <p className="text-gray-500 mb-4">无法找到该产品或您没有权限查看</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-3xl mx-auto">
        <ProductEditForm 
          product={product} 
          processingFees={processingFees}
          orgName={org_name} 
        />
      </div>
    </div>
  );
} 