import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ org_name: string; id: string }> }
) {
  try {
    // 获取认证Cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    
    // 如果没有认证令牌，返回未授权错误
    if (!authToken) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }
    
    const { org_name, id } = await params;
    
    // 构建API URL
    const apiUrl = `${process.env.BACKEND_API_URL}/api/v1/tenants/${org_name}/prices/${id}`;
    
    logger.debug(`拒绝价格，调用远程API: ${apiUrl}`);
    
    // 调用远程API
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: request.body
    });
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`拒绝价格失败: ${response.status} ${errorText}`);
      return NextResponse.json(
        { error: '拒绝价格失败', status: response.status, details: errorText },
        { status: response.status }
      );
    }
    
    // 解析响应数据
    const data = await response.json();
    
    // 返回响应
    return NextResponse.json(data.data || data);
  } catch (error) {
    logger.error(`处理拒绝价格请求时出错: ${error}`);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
} 