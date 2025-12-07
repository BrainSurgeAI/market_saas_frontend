import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || searchParams.get('page_size') || '20';
    const isRead = searchParams.get('isRead');
    const category = searchParams.get('category');
    
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('page_size', pageSize);
    if (isRead !== null && isRead !== undefined && isRead !== '') {
      queryParams.append('isRead', isRead);
    }
    if (category) {
      queryParams.append('category', category);
    }
    
    // 构建带查询参数的 endpoint
    const endpoint = `/notifications?${queryParams.toString()}`;
    
    // Call the Rust backend API using the unified fetchRemoteData function
    const response = await fetchRemoteData({
      endpoint: endpoint,
      method: 'GET',
      needToken: true,
      revalidate: 0
    });

    if (!response.success) {
      return NextResponse.json(
        {
          code: response.status || 500,
          message: `获取通知数据失败: ${response.error || '未知错误'}`,
          data: {
            data: [],
            total: 0,
            page: parseInt(page),
            page_size: parseInt(pageSize)
          },
          requestId: `req-${Date.now()}`,
          timestamp: new Date().toISOString()
        },
        { status: response.status || 500 }
      );
    }

    // Return the data in the expected format
    // Rust API 返回格式: { code, message, data: { data: [], total, page, page_size }, requestId, timestamp }
    const apiData = response.data?.data || response.data;
    
    return NextResponse.json({
      code: 200,
      message: 'success',
      data: apiData || {
        data: [],
        total: 0,
        page: parseInt(page),
        page_size: parseInt(pageSize)
      },
      requestId: response.data?.requestId || `req-${Date.now()}`,
      timestamp: response.data?.timestamp || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);

    return NextResponse.json(
      {
        code: 500,
        message: '服务器内部错误',
        data: {
          data: [],
          total: 0,
          page: 1,
          page_size: 20
        },
        requestId: `req-${Date.now()}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

