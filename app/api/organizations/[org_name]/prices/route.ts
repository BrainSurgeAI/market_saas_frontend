import { TokenPayload } from '@/app/models';
import { logger } from '@/lib/logger';
import { jwtDecode } from 'jwt-decode';


import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
        logger.error('No token found redirect to login');
        redirect('/login');
    }

    const decoded = jwtDecode<TokenPayload>(token);
    const username = decoded.username;
    const body = await request.json();
    const { prices } = body;
    logger.debug(`prices: ${JSON.stringify(prices)}`);

    const backendUrl = `${process.env.BACKEND_API_URL}/api/v1/product_prices`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(prices),
    });

    

    if (!response.ok) {
      logger.error(`Batch update prices error:, ${response.status}`);
      return NextResponse.json(
        { error: response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error) {
    logger.error(`Batch update prices error:, ${error}`);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }

}