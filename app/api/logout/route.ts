import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    
    // 可选：调用后端 API 使 token 失效
    // 如果你的后端有登出 API，可以在这里调用
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: '登出失败，请稍后再试' },
      { status: 500 }
    );
  }
}