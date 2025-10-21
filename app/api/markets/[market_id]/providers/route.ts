import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { fetchRemoteData } from '@/lib/api-utils';

/**
 * Get all providers for a market
 * 
 * @param request
 * @param params
 * @returns
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ market_id: string }> }) {
	const { market_id } = await params;

	const response = await fetchRemoteData({
		endpoint: `/markets/${market_id}/providers`,
		method: 'GET',
		tags: ['providers'],
		needToken: true
	});

	if (!response.success) {
		logger.error(`Failed to fetch providers: ${response.error}`);
		return NextResponse.json({ message: 'Failed to fetch providers' }, { status: 500 });
	}

	const data = response.data.data;
	return NextResponse.json(data);
}