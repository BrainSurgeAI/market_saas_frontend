import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数中的日期，如果没有则使用当日
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    
    // 构建带日期参数的 endpoint（如果提供了 date 参数）
    const endpoint = date 
      ? `/orders/dashboard-stats?date=${date}`
      : `/orders/dashboard-stats`;
    
    // Call the Rust backend API using the unified fetchRemoteData function
    const response = await fetchRemoteData({
      endpoint: endpoint,
      method: 'GET',
      needToken: true,
      tags: ['dashboard-stats']
    });

    if (!response.success) {
      return NextResponse.json(
        {
          code: response.status || 500,
          message: `获取仪表盘统计数据失败: ${response.error || '未知错误'}`,
          data: null,
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
      data: response.data?.data || response.data,
      requestId: `req-${Date.now()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);

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

