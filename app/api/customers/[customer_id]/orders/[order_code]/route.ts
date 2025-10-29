import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { fetchRemoteData } from '@/lib/api-utils';

/**
 * Get order details
 * @param _request
 * @param params
 * @returns
 */
export async function GET(_request: NextRequest,
	{ params }: { params: Promise<{ customer_id: string, order_code: string }> }
) {
	const { customer_id, order_code } = await params;
	const response = await fetchRemoteData({
		endpoint: `/orders/${order_code}`,
		method: 'GET',
		tags: [`orders-${customer_id}`]
	});

	if (!response.success) {
		logger.error(`Failed to fetch order details: #${order_code} customer_id: ${customer_id}: ${response.error}`);
		return NextResponse.json({ error: response.error }, { status: response.status });
	}

	return NextResponse.json(response.data.data);
}