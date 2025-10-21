import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

// 创建用户
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ market_id: string; tenant_hash: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      logger.error('未找到认证令牌，重定向到登录页');
      redirect('/login');
    }
    
    const body = await request.json();
    const { tenant_hash } = await params;
    
    const backendUrl = `${process.env.BACKEND_API_URL}/api/v1/tenants/${tenant_hash}/users`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
 
    const responseData = await response.json();

    return NextResponse.json(responseData, {
      status: response.status
    });
    
  } catch (error) {
    logger.error(`创建用户出错: ${error}`);
    return NextResponse.json(
      { 
        code: 500,
        message: '创建用户时发生服务器错误',
        requestId: '',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 获取用户列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ market_id: string; tenant_hash: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      logger.error('未找到认证令牌，重定向到登录页');
      redirect('/login');
    }
    
    const {tenant_hash} = await params;
    const backendUrl = `${process.env.BACKEND_API_URL}/api/v1/tenants/${tenant_hash}/users`;
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'gzip'
      }
    });
    
    const responseData = await response.json();
    return NextResponse.json(responseData);
    
  } catch (error) {
    logger.error(`获取用户列表出错: ${error}`);
    return NextResponse.json(
      { 
        code: 500,
        message: '获取用户列表时发生服务器错误',
        requestId: '',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 