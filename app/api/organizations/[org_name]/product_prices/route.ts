import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from "@/lib/api-utils";

export async function GET(
    request: NextRequest,
    { params }: { params: { org_name: string } }
) {
    try {
        const { org_name } = params;
        const { searchParams } = new URL(request.url);

        // 获取分页参数
        const page = searchParams.get('page') || '1';
        const page_size = searchParams.get('page_size') || '10';
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';

        // 构建查询参数
        const queryParams = new URLSearchParams({
            page: page.toString(),
            page_size: page_size.toString(),
        });

        if (search) {
            queryParams.append('search', search);
        }

        if (category && category !== 'all') {
            queryParams.append('category', category);
        }

        // 从远程服务获取数据
        const response = await fetchRemoteData({
            endpoint: `/product_prices?${queryParams.toString()}`,
            method: 'GET',
            revalidate: 0, // 不缓存，确保获取最新数据
        });

        if (!response.success) {
            return NextResponse.json(
                { success: false, error: response.error || 'Failed to fetch product prices' },
                { status: 500 }
            );
        }

        // API返回的数据结构: { code: 200, message: 'success', data: { data: [...], total: 219, page: 1, page_size: 10 } }
        // 我们需要直接返回这个data对象，而不是再包装一层
        return NextResponse.json({
            success: true,
            data: response.data.data // 直接返回data对象，包含data数组、total、page、page_size
        });

    } catch (error) {
        console.error('Error in product prices API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}