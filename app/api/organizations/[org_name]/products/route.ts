import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

/**
 * 处理GET请求，获取产品数据
 * 支持以下查询参数：
 * - page: 页码，默认为1
 * - limit: 每页数量，默认为10
 * - term: 搜索关键词
 * - category: 分类ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ org_name: string }> }
) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const term = searchParams.get('term');
    const category = searchParams.get('category');
    
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
    
    const org_name = (await params).org_name;
    let apiUrl = `${process.env.BACKEND_API_URL}/api/v1/tenants/${org_name}/products`;
    
    // 添加查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    if (term) {
      queryParams.append('name', term);
    }
    
    if (category) {
      queryParams.append('category_id', category);
    }
    
    // 如果有查询参数，添加到URL
    if (queryParams.toString()) {
      apiUrl += `?${queryParams.toString()}`;
    }
    
    // 调用远程API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      cache: 'no-store'
    });
    
    // 检查响应状态
    if (!response.ok) {
      logger.error(`API请求失败: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: '获取产品列表失败', status: response.status },
        { status: response.status }
      );
    }
    
    // 解析响应数据
    const data = await response.json();
    
    // 返回响应
    return NextResponse.json({
      products: data.data.products,
      total: data.data.total
    });
  } catch (error) {
    logger.error(`处理产品列表请求时出错: ${error}`);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * 处理POST请求，创建新产品
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ org_name: string }> }
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
    
    // 获取请求体
    const body = await request.json();
    const org_name = (await params).org_name;
    
    // 确保categoryId存在（三级分类的code）
    if (!body.categoryId) {
      return NextResponse.json(
        { error: '必须选择三级分类' },
        { status: 400 }
      );
    }
    
    // 构建API URL
    const apiUrl = `${process.env.BACKEND_API_URL}/api/v1/tenants/${org_name}/products`;
    
    logger.debug(`创建产品，调用远程API: ${apiUrl}`);
    logger.debug(`请求体: ${JSON.stringify(body)}`);
    
    // 调用远程API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: body.name,
        description: body.description || '',
        price: body.price ? Number(body.price) : 0,
        unit: body.unit,
        stock: body.stock ? Number(body.stock) : 0,
        category_code: body.categoryId, // 使用三级分类的code
        image: body.image || '',
      }),
    });
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`创建产品失败: ${response.status} ${errorText}`);
      return NextResponse.json(
        { error: '创建产品失败', status: response.status, details: errorText },
        { status: response.status }
      );
    }
    
    // 解析响应数据
    const data = await response.json();
    
    // 返回响应
    return NextResponse.json(data.data);
  } catch (error) {
    logger.error(`处理创建产品请求时出错: ${error}`);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}