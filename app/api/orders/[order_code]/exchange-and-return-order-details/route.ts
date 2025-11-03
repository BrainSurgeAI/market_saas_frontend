import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { fetchRemoteData } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ order_code: string }> }
) {
  const { order_code } = await params;

  try {
    const response = await fetchRemoteData({
      endpoint: `/orders/${order_code}/exchange-and-return-order-details`,
      method: 'GET',
      needToken: true,
      revalidate: 0,
    });

    if (!response.success) {
      logger.error(`获取退换货记录失败: ${response.error}`);
      return NextResponse.json({ message: '获取退换货记录失败' }, { status: response.status });
    }

    return NextResponse.json(response.data);
  } catch (error) {
    logger.error(`获取退换货记录时出错: ${error}`);
    return NextResponse.json({ message: '获取退换货记录时出错' }, { status: 500 });
  }
}
