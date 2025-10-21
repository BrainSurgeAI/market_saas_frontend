import { fetchRemoteData } from '@/lib/api-utils';
import { NextResponse } from 'next/server';

/**
 * Search products by name
 * @param request
 * @param params
 * @returns
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ customer_id: string, product_code: string }> }
) {

    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('name');

    if (!searchTerm || searchTerm.length < 2) {
        return NextResponse.json(
            { error: '搜索词太短，请输入至少2个字符' },
            { status: 400 }
        );
    }

    const { customer_id } = await params;
    const response = await fetchRemoteData({
        endpoint: `/customers/${customer_id}/products?name=${encodeURIComponent(searchTerm)}`,
        method: 'GET',
        tags: [searchTerm]
    });

    if (!response.success) {
        return NextResponse.json(
            { error: response.error || '搜索产品失败' },
            { status: response.status || 500 }
        );
    }

    return NextResponse.json(response.data.data || []);
} 