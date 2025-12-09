import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // 调用 Rust 后端 API
    const endpoint = '/orders/dashboard-stats';
    
    const response = await fetchRemoteData({
      endpoint: endpoint,
      method: 'GET',
      needToken: true,
      tags: ['orders-dashboard-stats'],
      revalidate: 0 // 不缓存，实时数据
    });

    if (!response.success) {
      return NextResponse.json(
        {
          code: response.status || 500,
          message: `获取订单统计数据失败: ${response.error || '未知错误'}`,
          data: null,
          requestId: `req-${Date.now()}`,
          timestamp: new Date().toISOString()
        },
        { status: response.status || 500 }
      );
    }

    // 返回标准格式的响应
    return NextResponse.json({
      code: 200,
      message: 'success',
      data: response.data?.data || response.data,
      requestId: `req-${Date.now()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching order statistics:', error);

    return NextResponse.json(
      {
        code: 500,
        message: '服务器内部错误',
        data: null,
        requestId: `req-${Date.now()}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

