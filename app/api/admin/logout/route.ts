import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
	try {
		// 获取cookie存储
		const cookieStore = await cookies();
		cookieStore.delete('auth-token');

		logger.info('管理员成功登出');

		return NextResponse.json(
			{ success: true, message: '登出成功' },
			{ status: 200 }
		);
	} catch (error) {
		logger.error('管理员登出失败:', error);

		return NextResponse.json(
			{ success: false, message: '登出失败，请稍后重试' },
			{ status: 500 }
		);
	}
} 