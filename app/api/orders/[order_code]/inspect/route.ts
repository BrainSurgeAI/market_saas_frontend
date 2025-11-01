import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';

import { fetchRemoteData } from '@/lib/api-utils';

/**
 * 签收订单，包括退换货和签收
 * @param request 
 * @param param1 
 * @returns 
 */
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ customer_id: string; order_code: string }> }
) {
	const { customer_id, order_code } = await params;

	try {
		const operationData = await request.json();
		logger.debug(JSON.stringify(operationData));

		const response = await fetchRemoteData({
			endpoint: `/orders/${order_code}/inspect-sub-orders`,
			method: 'PATCH',
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