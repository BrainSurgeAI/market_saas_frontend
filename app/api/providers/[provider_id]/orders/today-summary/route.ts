import { NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider_id: string }> }
) {
  try {
    const { provider_id } = await params;
   
    const result = await fetchRemoteData({
      endpoint: `/providers/${provider_id}/orders/today-summary`,
      method: 'GET',
      tags: [`provider-${provider_id}-today-summary`],
      revalidate: 0, // 不缓存，每次获取最新数据
      needToken: true
    });

    if (!result.success) {
      console.error('API错误:', result.error);
      return NextResponse.json(
        { 
          code: result.status || 500,
          message: '获取数据失败',
          data: [],
          error: result.error || '获取今日订单汇总失败'
        },
        { status: result.status || 500 }
      );
    }

    // 确保返回格式与前端期望的格式一致
    return NextResponse.json({
      code: 200,
      message: 'success',
      data: result.data.data || [],
      requestId: result.data.requestId || '',
      timestamp: result.data.timestamp || new Date().toISOString()
    });
  } catch (error) {
    console.error('处理请求时出错:', error);
    return NextResponse.json(
      { 
        code: 500,
        message: '服务器错误',
        data: [],
        error: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
} 