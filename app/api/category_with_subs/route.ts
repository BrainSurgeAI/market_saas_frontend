import { fetchRemoteData } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
	const response = await fetchRemoteData({
		endpoint: '/category_with_sub_categories',
		method: 'GET',
		needToken: true,
		tags: ['category_with_sub_categories']
	});

	if (!response.success) {
		logger.error(`Failed to fetch category with sub categories: ${response.error}`);
		return NextResponse.json(
			{ error: response.error },
			{ status: response.status }
		);
	}

	const data = response.data;
	return NextResponse.json(data.data || data);
}