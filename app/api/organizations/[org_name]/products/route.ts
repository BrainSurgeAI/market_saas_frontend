import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ org_name: string }> }
) {
    try {
        const { org_name } = await params;

        // 获取查询参数
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || '1';
        const pageSize = searchParams.get('limit') || searchParams.get('page_size') || '10';

        // 构建后端API端点，包含分页参数
        const endpoint = `/tenants/${org_name}/products?page=${page}&pageSize=${pageSize}`;

        console.log(`Fetching products for org: ${org_name}, page: ${page}, pageSize: ${pageSize}`);

        // 使用fetchRemoteData调用远程API
        const response = await fetchRemoteData({
            endpoint,
            needToken: true,
            tags: [`products-${org_name}-page-${page}-size-${pageSize}`],
            revalidate: 0
        });

        if (!response.success) {
            console.error('Failed to fetch products:', response.error);
            return NextResponse.json(
                { error: response.error || '获取产品列表失败' },
                { status: response.status || 500 }
            );
        }

        return NextResponse.json(response.data);

    } catch (error) {
        console.error('Products API error:', error);
        return NextResponse.json(
            { error: '服务器错误，请稍后再试' },
            { status: 500 }
        );
    }
}