import { NextRequest } from "next/server";
import { handleApiRequest } from "@/lib/api-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ org_name: string; product_code: string }> }
) {
  const { org_name, product_code } = await params;
  const endpoint = `${process.env.BACKEND_API_URL}/api/v1/tenants/${org_name}/products/${product_code}/archive`;
  return handleApiRequest(
    request,
    endpoint,
    'DELETE',
    '下架产品失败',
    '下架产品成功'
  );
} 