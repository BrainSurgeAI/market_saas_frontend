import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { fetchRemoteData } from '@/lib/api-utils';

/**
 * Create an order for a specific customer
 * @param request
 * @param params
 * @returns
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ customer_id: string }> }) {

	const { customer_id } = await params;

	const body = await request.json();
	const response = await fetchRemoteData({
		endpoint: `/orders`,
		method: 'POST',
		body: body,
		needToken: true,
		revalidate: 0
	});

	if (!response.success) {
		logger.error(`Failed to create order for customer_id ${customer_id}: ${response.error}`);
		return NextResponse.json({ message: 'Failed to create order' }, { status: response.status });
	}

	return NextResponse.json(response.data);
}

/**
 * Get orders for a specific customer
 * @param request
 * @param params
 * @returns
 */
export async function GET(request: NextRequest,
	{ params }: { params: Promise<{ customer_id: string }> }
) {
	const { customer_id } = await params;

	const searchParams = request.nextUrl.searchParams;
	const page = searchParams.get('page') ?? '1';
	const pageSize = searchParams.get('page_size') ?? '10';

	const response = await fetchRemoteData({
		endpoint: `/orders?page=${page}&page_size=${pageSize}`,
		method: 'GET',
		needToken: true,
		tags: [`orders-${customer_id}`]
	});

	if (!response.success) {
		logger.error(`Failed to fetch orders for customer_id: ${customer_id}: ${response.error}`);
		return NextResponse.json({ message: 'Failed to fetch orders' }, { status: response.status });
	}

	return NextResponse.json(response.data.data);
}
