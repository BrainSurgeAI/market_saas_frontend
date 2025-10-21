import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { fetchRemoteData } from '@/lib/api-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ org_name: string; id: string }> }
) {
  try {
    const { org_name } = await params;
    const body = await request.json()

    logger.debug(`审核通过价格，调用远程API: ${JSON.stringify(body)}`)

    const response = await fetchRemoteData({
      endpoint: `/tenants/${org_name}/prices/aprox_price`,
      method: 'PATCH',
      body: body,
      needToken: true,
      tags: ['product_prices'],
      revalidate: 0,
    })

    if (!response.success) {
      logger.error(`审核通过价格失败: ${response.error}`)
      return NextResponse.json(
        { error: '审核通过价格失败', status: response.status, details: response.error },
        { status: response.status }
      );
    }

    const data = response.data.data

    return NextResponse.json(data);
  } catch (error) {
    logger.error(`处理审核通过价格请求时出错: ${error}`);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 