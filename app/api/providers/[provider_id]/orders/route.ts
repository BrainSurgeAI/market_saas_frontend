import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

/**
 * Get orders for a specific provider
 * @param request
 * @param params
 * @returns
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ provider_id: string }> }
) {
	const { provider_id } = await params;

	const searchParams = request.nextUrl.searchParams;
	const page = searchParams.get('page') ?? '1';
	const pageSize = searchParams.get('page_size') ?? '10';

	const response = await fetchRemoteData({
		endpoint: `/orders?page=${page}&page_size=${pageSize}`,
		method: 'GET',
		needToken: true,
		tags: [`provider-orders-${provider_id}`],
		revalidate: 0
	});

	if (!response.success) {
		logger.error(`Failed to fetch orders for provider_id: ${provider_id}: ${response.error}`);
		return NextResponse.json({ message: 'Failed to fetch orders' }, { status: response.status });
	}

	return NextResponse.json(response.data?.data || response.data || []);
}

