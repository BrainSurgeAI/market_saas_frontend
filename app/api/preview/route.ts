import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { objectKey } = await request.json();
    
    if (!objectKey) {
      return NextResponse.json(
        { error: '没有提供对象路径' },
        { status: 400 }
      );
    }
    
    // 获取华为云OBS的临时授权参数
    // 这里复用现有的OBS签名生成接口，但改用GET方法
    const obsResponse = await fetch(`${request.nextUrl.origin}/api/obs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: objectKey,
        contentType: 'image/*',
        method: 'GET', // 指定使用GET方法获取签名URL
      }),
    });
    
    if (!obsResponse.ok) {
      const errorData = await obsResponse.json();
      throw new Error(errorData.error || '获取预览URL失败');
    }
    
    const { signedUrl } = await obsResponse.json();
    
    return NextResponse.json({
      success: true,
      signedUrl
    });
    
  } catch (error) {
    console.error('获取预览URL失败:', error);
    return NextResponse.json(
      { error: (error as Error).message || '获取预览URL失败' },
      { status: 500 }
    );
  }
} 