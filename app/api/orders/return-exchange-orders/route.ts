import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';

export async function GET(_request: NextRequest) {
  try {
    // Call the Rust backend API using the unified fetchRemoteData function
    const response = await fetchRemoteData({
      endpoint: '/orders/return-exchange-orders',
      method: 'GET',
      needToken: true,
      revalidate: 0
    });

    if (!response.success) {
      return NextResponse.json(
        {
          code: response.status || 500,
          message: `获取退换货订单数据失败: ${response.error || '未知错误'}`,
          data: [],
          requestId: `req-${Date.now()}`,
          timestamp: new Date().toISOString()
        },
        { status: response.status || 500 }
      );
    }

    // Return the data in the expected format
    return NextResponse.json({
      code: 200,
      message: 'success',
      data: response.data?.data || response.data || [],
      requestId: response.data?.requestId || `req-${Date.now()}`,
      timestamp: response.data?.timestamp || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching return exchange orders:', error);

    return NextResponse.json(
      {
        code: 500,
        message: '服务器内部错误',
        data: [],
        requestId: `req-${Date.now()}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

