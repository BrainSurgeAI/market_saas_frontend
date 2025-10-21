import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { fetchRemoteData } from '@/lib/api-utils';

/**
 * 处理GET请求，获取产品数据
 * 支持以下查询参数：
 * - page: 页码，默认为1
 * - limit: 每页数量，默认为10
 * - term: 搜索关键词
 * - category: 分类ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  logger.info(`获取产品列表请求: ${request.nextUrl.searchParams}`);
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('page_size') || '12');
  const term = searchParams.get('term');
  const category = searchParams.get('category_id');

  const { customer_id } = await params;
  let endpoint = `/customers/${customer_id}/products`;

  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('page_size', pageSize.toString());

  if (term) {
    queryParams.append('name', term);
  }

  if (category && category !== 'all') {
    queryParams.append('category_id', category);
  }

  if (queryParams.toString()) {
    endpoint += `?${queryParams.toString()}`;
  }

  const response = await fetchRemoteData({ endpoint, method: 'GET', tags: [queryParams.toString()] });

  if (!response.success) {
    return NextResponse.json(
      { error: response.error || '获取产品列表失败' },
      { status: response.status || 500 }
    );
  }

  return NextResponse.json({
    products: response.data.data,
    total: response.data.total
  });
}