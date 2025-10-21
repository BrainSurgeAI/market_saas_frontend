import { NextRequest } from "next/server";
import { handleApiRequest } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ org_name: string; product_code: string }> }
) {
  const { org_name, product_code } = await params;
  const endpoint = `${process.env.BACKEND_API_URL}/api/v1/tenants/${org_name}/products/${product_code}/enable`;
  return handleApiRequest(
    request,
    endpoint,
    'PATCH',
    '启用产品失败',
    '启用产品成功'
  );
}