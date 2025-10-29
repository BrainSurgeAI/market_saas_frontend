import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { fetchRemoteData } from '@/lib/api-utils';
import { parseJSON } from 'date-fns';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ market_id: string, order_code: string }> }) {
    const { market_id, order_code } = await params;
    const body = await request.json();

    const response = await fetchRemoteData({
        endpoint: `/orders/${order_code}/assign`,
        method: 'PATCH',
        body: body,
        needToken: true
    });

    if (!response.success) {
        logger.error(`Failed to assign order ${order_code} to provider ${body.providerId}: ${response.error}`);
        return NextResponse.json({ message: response.error }, { status: response.status });
    }

    return NextResponse.json(response.data.data);
}