import { TokenPayload } from '@/app/models';
import { logger } from '@/lib/logger';
import { jwtDecode } from 'jwt-decode';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request 
) {
  try {
    // 获取URL参数
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('name');
    
    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json(
        { error: '搜索词太短，请输入至少2个字符' },
        { status: 400 }
      );
    }
    
    // 获取认证信息
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      logger.error('未找到认证令牌，重定向到登录页面');
      redirect('/login');
    }
    
    const decoded = jwtDecode<TokenPayload>(token);
    const tenant_name = decoded.tenant_name;
    
    // 构建API URL
    const backendUrl = `${process.env.BACKEND_API_URL}/api/v1/tenants/${tenant_name}/products?name=${encodeURIComponent(searchTerm)}`;
    logger.debug(`调用后端API: ${backendUrl}`);
    
    // 发送请求到后端API
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      logger.error(`搜索产品失败: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: response.statusText },
        { status: response.status }
      );
    }
    
    // 解析响应数据
    const data = await response.json();  
    // 返回搜索结果
    return NextResponse.json(data.data || []);
    
  } catch (error) {
    logger.error('搜索产品时出错:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后再试' },
      { status: 500 }
    );
  }
} 