import { fetchRemoteData } from '@/lib/api-utils';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const response = await fetchRemoteData({
            endpoint: '/reconciliation_statements',
            method: 'POST',
            needToken: true,
        });

        if (!response.success) {
            throw new Error(response.error);
        }

        const data = response.data;

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('生成结算单时出错:', error);
        return NextResponse.json(
            { success: false, error: '生成结算单失败' },
            { status: 500 }
        );
    }
} 