import { TokenPayload } from '@/app/models';
import { logger } from '@/lib/logger';
import { jwtDecode } from 'jwt-decode';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function GET(_: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
        if (!token) {
            logger.error('No token found redirect to login');
            redirect('/login');
        }

        const decoded = jwtDecode<TokenPayload>(token);
        const username = decoded.username;

        const backendUrl = `${process.env.BACKEND_API_URL}/api/v1/notifications`;
        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            logger.error('Get notifications error:', response);
            return NextResponse.json(
                { error: response.statusText },
                { status: response.status }
            );
        }
        return NextResponse.json(await response.json());

    } catch (error) {
        logger.error('Get notifications error:', error);
        return NextResponse.json(
            { error: '服务器错误，请稍后再试' },
            { status: 500 }
        );
    }
}