import { NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { fetchRemoteData } from '@/lib/api-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ order_code: string }> }
) {
  const { order_code } = await params;

  try {
    const response = await fetchRemoteData({
      endpoint: `/orders/${order_code}/begin-inspect-order`,
      method: 'PATCH',
      needToken: true,
      revalidate: 0,
    });

    if (!response.success) {
      logger.error(`开始验收失败: ${response.error}`);
      return NextResponse.json({ message: '开始验收失败' }, { status: response.status });
    }

    return NextResponse.json(response.data);
  } catch (error) {
    logger.error(`开始验收时出错: ${error}`);
    return NextResponse.json({ message: '开始验收时出错' }, { status: 500 });
  }
}
