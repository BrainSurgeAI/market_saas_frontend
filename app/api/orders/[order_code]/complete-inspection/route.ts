import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';

import { fetchRemoteData } from '@/lib/api-utils';

// 完成订单验收
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ order_code: string }> }
) {
	const { order_code } = await params;

	try {
		const operationData = await request.json();
		logger.debug(JSON.stringify(operationData));

		const response = await fetchRemoteData({
			endpoint: `/orders/${order_code}/complete-inspection`,
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