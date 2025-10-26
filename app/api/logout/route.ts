import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');

    // 清理菜单缓存和其他本地存储数据
    // 注意：服务端无法直接访问 localStorage，所以返回指令让客户端清理
    const response = NextResponse.json({
      success: true,
      clearCache: true
    });

    // 设置响应头，通知客户端清理缓存
    response.headers.set('X-Clear-Cache', 'true');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: '登出失败，请稍后再试' },
      { status: 500 }
    );
  }
}