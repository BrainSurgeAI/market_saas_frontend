import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';

import { fetchRemoteData } from '@/lib/api-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ order_code: string }> }
) {
  const { order_code } = await params;

  try {
    const payload = await request.json();
    logger.debug(JSON.stringify(payload));

    const response = await fetchRemoteData({
      endpoint: `/orders/${order_code}/deliver-to-market`,
      method: 'PUT',
      body: payload,
      needToken: true,
      revalidate: 0,
    });

    if (!response.success) {
      logger.error(`提交订单配送记录失败: ${response.error}`);
      return NextResponse.json({ message: '提交订单配送记录失败' }, { status: response.status });
    }

    return NextResponse.json(response.data);
  } catch (error) {
    logger.error(`提交订单配送记录时出错: ${error}`);
    return NextResponse.json({ message: '提交订单配送记录时出错' }, { status: 500 });
  }
}
