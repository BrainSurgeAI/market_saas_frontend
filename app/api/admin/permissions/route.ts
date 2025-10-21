import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
	try {
		const endpoint = '/permissions';
		const searchParams = request.nextUrl.searchParams;
		const module = searchParams.get('module');

		// 如果有module参数，添加到endpoint
		const finalEndpoint = module
			? `${endpoint}?module=${encodeURIComponent(module)}`
			: endpoint;

		const response = await fetchRemoteData({
			endpoint: finalEndpoint,
			method: 'GET',
			tags: ['permissions'],
			revalidate: 60 * 10 // 10分钟缓存
		});

		if (!response.success) {
			return NextResponse.json(
				{ message: response.error },
				{ status: response.status }
			);
		}

		return NextResponse.json(response.data);
	} catch (error) {
		logger.error('获取权限列表出错:', error);
		return NextResponse.json(
			{ message: '服务器内部错误' },
			{ status: 500 }
		);
	}
} 