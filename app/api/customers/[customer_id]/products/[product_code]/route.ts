import { NextRequest, NextResponse } from "next/server";
import { fetchRemoteData, handleApiRequest } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

/**
 * Get product detail by product code
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ customer_id: string; product_code: string }> }
): Promise<NextResponse> {
	const { customer_id, product_code } = await params;
	const response = await fetchRemoteData({
		endpoint: `/tenants/${customer_id}/products/${product_code}`,
		method: 'GET',
		needToken: true,
		tags: [`product_detail_${product_code}`],
	});

	if (!response.success) {
		logger.error(`Failed to fetch product detail: ${response.error}`);
		return NextResponse.json({
			success: false,
			status: response.status,
			error: response.error,
		});
	}

	const data = response.data.data;
	return NextResponse.json({
		success: true,
		data: data,
	});
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ customer_id: string; product_code: string }> }
): Promise<NextResponse> {
	logger.info(`Updating product detail: ${params}`);
	const { customer_id, product_code } = await params;
	const endpoint = `${process.env.BACKEND_API_URL}/api/v1/tenants/${customer_id}/products/${product_code}`;
	return handleApiRequest(
		request,
		endpoint,
		'PATCH',
		'更新产品信息失败',
		'更新产品信息成功'
	);
}