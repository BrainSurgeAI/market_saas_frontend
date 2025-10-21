import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { fetchRemoteData } from "@/lib/api-utils";

/**
 * 客户签收订单，包括退换货和签收
 * @param request 
 * @param param1 
 * @returns 
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ customer_id: string; order_code: string }> }
) {
	const { customer_id, order_code } = await params;

	try {
		const operationData = await request.json();
		logger.debug(JSON.stringify(operationData));

		const response = await fetchRemoteData({
			endpoint: `/customers/${customer_id}/orders/${order_code}/operations`,
			method: 'POST',
			body: operationData,
			needToken: true,
			revalidate: 0
		});

		if (!response.success) {
			logger.error(`提交订单操作记录失败: ${response.error}`);
			return NextResponse.json({ message: '提交订单操作记录失败' }, { status: response.status });
		}

		return NextResponse.json(response.data);
	} catch (error) {
		logger.error(`提交订单操作记录时出错: ${error}`);
		return NextResponse.json({ message: '提交订单操作记录时出错' }, { status: 500 });
	}
}


/**
 * 客户完成订单验收
 * @param request 
 * @param params
 * @returns 
 */
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ customer_id: string; order_code: string }> }
) {
	const { customer_id, order_code } = await params;
	const operationData = await request.json();

	const response = await fetchRemoteData({
		endpoint: `/tenants/${customer_id}/orders/${order_code}/operations`,
		method: 'PATCH',
		body: operationData,
		needToken: true,
		revalidate: 0
	});

	if (!response.success) {
		logger.error(`确认收货失败: ${response.error}`);
		return NextResponse.json({ message: '确认收货失败' }, { status: response.status });
	}

	return NextResponse.json(response.data);
}