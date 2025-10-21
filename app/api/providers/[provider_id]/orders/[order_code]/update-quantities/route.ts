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
            const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/providers/${provider_id}/orders/${order_code}/update-quantities`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            logger.error(`Failed to assign order: ${response.statusText}`);
            return NextResponse.json({ message: 'Failed to assign order' }, { status: response.status });
        }

        const data = await response.json();
        logger.debug(`Order assigned: ${JSON.stringify(data.data)}`);
        return NextResponse.json(data.data);
    } catch (error) {
        logger.error(`Failed to assign order: ${error}`);
        return NextResponse.json({ message: 'Failed to assign order' }, { status: 500 });
    }
}