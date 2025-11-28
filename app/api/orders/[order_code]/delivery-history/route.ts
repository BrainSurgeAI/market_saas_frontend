import { NextRequest, NextResponse } from 'next/server';
import { fetchRemoteData } from '@/lib/api-utils';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ order_code: string }> }
) {
  const { order_code } = await params;

  const response = await fetchRemoteData({
    endpoint: `/orders/${order_code}/delivery-history`,
    method: 'GET',
    needToken: true,
    revalidate: 0
  });
  
  if (!response.success) {
    return NextResponse.json({ message: '获取配送历史失败' }, { status: response.status });
  }

  return NextResponse.json(response.data);

}
