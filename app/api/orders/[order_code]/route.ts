import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { redirect } from 'next/navigation';
import { fetchRemoteData } from '@/lib/api-utils';

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ order_code: string }> }
) {
	const { order_code } = await params;

	const cookieStore = await cookies();
	const token = cookieStore.get('auth-token')?.value;
	if (!token) {
		logger.warn('No token found');
		redirect('/login');
	}

	try {
		const body = await request.json();
		logger.debug(`Begin inspect order: ${order_code}, body: ${JSON.stringify(body)}`);

		const endpoint = body.status === 'SUPPLIER_DELIVERING' ? `/orders/${order_code}/begin-inspect-order` : `/orders/${order_code}/begin-exchange-inspect-order`;
		const response = await fetchRemoteData({
			endpoint: endpoint,
			method: 'PATCH',
			body: body,
			needToken: true
		});

		if (!response.success) {
			logger.error(`Failed to begin inspect order: ${response.error}`);
			return NextResponse.json(
				{ message: response.error || '开始验收失败' },
				{ status: response.status || 500 }
			);
		}

		// 返回后端响应数据
		return NextResponse.json(response.data);
	} catch (error) {
		logger.error(`Failed to begin inspect order: ${error}`);
		return NextResponse.json(
			{ message: 'Failed to begin inspect order' },
			{ status: 500 }
		);
	}
}

export async function GET(_request: NextRequest,
	{ params }: { params: Promise<{  order_code: string }> }
) {
	const { order_code } = await params;

	logger.info(`Fetching order details for: ${order_code}`);

	const response = await fetchRemoteData({
		endpoint: `/orders/${order_code}`,
		method: 'GET',
		tags: [`orders-${order_code}`]
	});

	if (!response.success) {
		logger.error(`Failed to fetch order details: #${order_code}: ${response.error}`);
		return NextResponse.json({ error: response.error }, { status: response.status });
	}

	// 检查响应数据
	const remoteData = response.data;
	

	if (!remoteData || typeof remoteData !== 'object') {
		logger.error(`Invalid remote data for order ${order_code}:`, remoteData);
		return NextResponse.json({ error: 'Invalid response from remote API' }, { status: 502 });
	}

	// 对于PROVIDER格式，后端直接返回data字段
	const responseData = remoteData.data || remoteData;

	if (!responseData) {
		logger.error(`No data returned for order ${order_code}`);
		return NextResponse.json({ error: 'No data available' }, { status: 404 });
	}

	return NextResponse.json(responseData);
}

