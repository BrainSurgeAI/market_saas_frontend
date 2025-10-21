import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// // 租户验证模式定义
// export const tenantSchema = z.object({
//   name: z.string().trim().min(1).max(255),
//   address: z.string()
//     .trim()
//     .max(64, "地址不能超过64个字符")
//     .refine(
//       val => !val || /^[a-zA-Z0-9\u4e00-\u9fa5\s,.'()#-]+$/.test(val),
//       "地址只能包含中文、英文、数字和常用标点符号"
//     )
//     .optional()
//     .transform(val => val === '' ? undefined : val),
//   tenantType: z.string(),
// });

// type TenantCreateRequest = z.infer<typeof tenantSchema>;

// 获取租户列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ market_id: string }> }
) {
  try {
    // 获取认证令牌
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      redirect('/login');
    }

    const marketId = (await params).market_id;

    const response = await fetch(
      `${process.env.BACKEND_API_URL}/api/v1/markets/${marketId}/tenants`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'gzip'
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('获取租户列表失败:', error);
    return NextResponse.json(
      { code: 500, message: '服务器内部错误', data: null },
      { status: 500 }
    );
  }
}

// 创建新租户
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ market_id: string }> }
) {
  try {
    // 获取认证令牌
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      redirect('/login');
    }

    const marketId = (await params).market_id;
    const requestBody = await request.json();

    const response = await fetch(
      `${process.env.BACKEND_API_URL}/api/v1/markets/${marketId}/tenants`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'gzip'
        },
        body: JSON.stringify(requestBody),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      logger.error('创建租户失败:', responseData.message);
      switch (response.status) {
        case 400:
          return NextResponse.json(
            {
              code: response.status,
              message: '数据验证失败',
              data: null
            },
            { status: response.status }
          );
        case 409:
          return NextResponse.json(
            {
              code: response.status,
              message: '租户已存在',
              data: null
            },
            { status: response.status }
          );
        default:
          return NextResponse.json(
            {
              code: response.status,
              message: responseData.message || '创建租户失败',
              data: null
            },
            { status: response.status }
          );
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('创建租户失败:', error);
    return NextResponse.json(
      { code: 500, message: '服务器内部错误', data: null },
      { status: 500 }
    );
  }
} 