import { NextRequest, NextResponse } from "next/server";
import { fetchRemoteData, handleApiRequest } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ org_name: string; product_code: string }> }
) {
  const { org_name, product_code } = await params;
  const endpoint =  `${process.env.BACKEND_API_URL}/api/v1/tenants/${org_name}/products/${product_code}`;
  return handleApiRequest(
    request,
    endpoint,
    'GET',
    '获取产品详情失败',
    '获取产品详情成功'
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ org_name: string; product_code: string }> }
) {
  const { org_name, product_code } = await params;
  const body = await request.json();
  console.log(JSON.stringify(body));
  
  const response = await fetchRemoteData({
    endpoint: `/tenants/${org_name}/products/${product_code}`,
    method: 'PUT',
    body: body,
    tags: ['products-update'],
    revalidate: 0,
    needToken: true
  })

  if (!response.success) {
    return NextResponse.json({
      success: false,
      message: response.error
    }, { status: 500 })
  }
  return NextResponse.json({
    success: true,
    message: '更新产品信息成功'
  }, { status: 200 })
}