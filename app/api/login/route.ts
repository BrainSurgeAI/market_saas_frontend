import { TokenPayload } from '@/app/models';
import { fetchRemoteData } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { jwtDecode } from 'jwt-decode';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

/**
 * User login
 * @param request
 * @returns login response
 * @description
 * 1. Get username and password from request
 * 2. Fetch login data from backend
 * 3. Check if login is successful
 * 4. If successful, set token to cookie
 * 5. Return login response
 * 
 * @example
 * ```ts
 * const response = await fetchRemoteData({
 *   endpoint: '/login',
 *   method: 'POST',
 *   body: { username, password },
 * });
 * ```
 * 
 * @returns login response
 * @returns 400 error if username or password format is incorrect
 * @returns 401 error if username or password is incorrect
 * @returns 500 error if token decode error or other errors
 */
export async function POST(request: NextRequest) {
	const { username, password } = await request.json();
	const response = await fetchRemoteData({
		endpoint: '/login',
		method: 'POST',
		body: { username, password },
		needToken: false,
		revalidate: 0
	});

	if (!response.success) {
		logger.warn(`Login failed: ${response.error}`);
		switch (response.status) {
			case 400:
				return NextResponse.json(
					{ error: '用户名或密码错误' },
					{ status: response.status }
				);
			case 401:
				return NextResponse.json(
					{ error: '用户名或密码错误' },
					{ status: response.status }
				);
			default:
				return NextResponse.json(
					{ error: response.error },
					{ status: response.status }
				);
		}
	}

	const token = response.data.data;
	let maxAge = 60 * 60 * 12; // default 12 hours
	try {
		const decoded = jwtDecode<TokenPayload>(token);
		if (decoded.exp) {
			const currentTime = Math.floor(Date.now() / 1000);
			maxAge = decoded.exp - currentTime;
			if (maxAge <= 0) {
				logger.warn('Token already expired, redirect to login');
				redirect('/login');
			}
		}
	} catch (error) {
		logger.error(`Token decode error: ${error}`);
		return NextResponse.json(
			{ error: 'Token decode error' },
			{ status: 500 }
		);
	}

	const cookieStore = await cookies();
	cookieStore.set('auth-token', token, {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/',
		maxAge: maxAge
	});

	logger.info(`${username} login successful`);
	return NextResponse.json(response.data);
}