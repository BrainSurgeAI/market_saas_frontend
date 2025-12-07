import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ message_id: string }> }
) {
  try {
    const { message_id } = await params;
    const body = await request.json();
    
    // 构建 endpoint
    const endpoint = `/notifications/${message_id}`;
    
    // Call the Rust backend API using the unified fetchRemoteData function
    const response = await fetchRemoteData({
      endpoint: endpoint,
      method: 'PATCH',
      body: body,
      needToken: true,
      revalidate: 0
    });

    if (!response.success) {
      return NextResponse.json(
        {
          code: response.status || 500,
          message: `标记通知已读失败: ${response.error || '未知错误'}`,
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
      requestId: response.data?.requestId || `req-${Date.now()}`,
      timestamp: response.data?.timestamp || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);

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

