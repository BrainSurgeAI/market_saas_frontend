import { TokenPayload } from '@/app/models';
import { fetchRemoteData } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { jwtDecode } from 'jwt-decode';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { username, password, phone, verificationCode } = body;

		// 验证手机验证码
		// 在实际应用中，需要添加验证码的验证逻辑
		if (!verificationCode || verificationCode.length !== 6 || phone !== '13341316677') {
			return NextResponse.json(
				{ error: '验证码无效' },
				{ status: 400 }
			);
		}

		const response = await fetchRemoteData({
			endpoint: '/superadmin/login',
			method: 'POST',
			body: { username, password, phone, verificationCode },
			tags: ['admin_login'],
			revalidate: 0,
			needToken: false
		});

		if (!response.success) {
			return NextResponse.json(
				{ error: response.error },
				{ status: response.status }
			);
		}

		const token = response.data.data;

		let maxAge = 60 * 60 * 24; // default 1 day
		const decoded = jwtDecode<TokenPayload>(token);
		if (decoded.exp) {
			const currentTime = Math.floor(Date.now() / 1000);
			maxAge = decoded.exp - currentTime;

			if (maxAge <= 0) {
				logger.warn('Token already expired, redirect to login');
				redirect('/login');
			}
		}

		const cookieStore = await cookies();
		cookieStore.set('auth-token', token, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: maxAge
		});

		return NextResponse.json(response.data);

	} catch (error) {
		logger.error('Admin login error:', error);
		return NextResponse.json(
			{ error: '服务器错误，请稍后再试' },
			{ status: 500 }
		);
	}
} 