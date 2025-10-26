import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ org_name: string }> }
) {
  try {
    const { org_name } = await params;
    const body = await request.json();
    const { prices } = body;

    console.log(`Bulk price update for organization ${org_name}:`, JSON.stringify(prices));

    // 构建后端API端点
    const endpoint = `/product_prices`;

    // 使用fetchRemoteData调用远程API
    const response = await fetchRemoteData({
      endpoint,
      method: 'POST',
      body: prices,
      needToken: true,
      tags: ['bulk-price-update'],
      revalidate: 0
    });

    console.log('Bulk price update response:', response);

    if (!response.success) {
      console.error('Bulk price update failed:', response.error);
      return NextResponse.json(
        { error: response.error || '批量更新价格失败' },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(response.data);

  } catch (error) {
    console.error('Bulk price update error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
}