import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export async function GET() {
	let response = await fetchRemoteData({
		endpoint: '/roles',
		method: 'GET',
		tags: ['roles']
	});
	if (!response.success) {
		logger.error(`Failed to get roles: ${response.error}`);
		return NextResponse.json(
			{ message: response.error },
			{ status: response.status }
		);
	}

	return NextResponse.json(response.data);
}

/**
 * Create a new role
 * @param request
 * @returns
 */
export async function POST(request: NextRequest) {
	const body = await request.json();
	const response = await fetchRemoteData({
		endpoint: '/roles',
		method: 'POST',
		body: body,
		needToken: true,
		revalidate: 0
	});

	if (!response.success) {
		logger.error(`Failed to create role: ${response.error}`);
		return NextResponse.json(
			{ message: response.error },
			{ status: response.status }
		);
	}

	return NextResponse.json(response.data);
} 