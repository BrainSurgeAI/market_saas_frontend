import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { redirect } from 'next/navigation';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ provider_id: string, order_code: string }> }) {
    const { provider_id, order_code } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
        logger.warn('No token found');
        redirect('/login');
    }

    try {
        const body = await request.json();
            const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/orders/${order_code}/deliver-to-market`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            logger.error(`Failed to deliver order to market: ${response.statusText}`);
            return NextResponse.json({ message: 'Failed to deliver order to market' }, { status: response.status });
        }

        const data = await response.json();
        logger.debug(`Order delivered to market: ${JSON.stringify(data.data)}`);
        return NextResponse.json(data.data);
    } catch (error) {
        logger.error(`Failed to deliver order to market: ${error}`);
        return NextResponse.json({ message: 'Failed to deliver order to market' }, { status: 500 });
    }
}