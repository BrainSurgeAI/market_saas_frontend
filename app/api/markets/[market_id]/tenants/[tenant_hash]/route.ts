import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
//import { z } from 'zod';

// 租户更新验证模式
// export const tenantUpdateSchema = z.object({
//   name: z.string()
//     .trim()
//     .min(6, "租户名称不能少于6个字符")
//     .max(255, "租户名称不能超过255个字符"),
//   address: z.string()
//     .trim()
//     .min(6, "地址不能少于6个字符")
//     .max(64, "地址不能超过64个字符")
//     .refine(
//       val => /^[a-zA-Z0-9\u4e00-\u9fa5\s,.'()#-]+$/.test(val),
//       "地址只能包含中文、英文、数字和常用标点符号"
//     ),
//   tenantType: z.enum(["CUSTOMER", "PROVIDER", "MARKET"]),
// });

// type TenantUpdateRequest = z.infer<typeof tenantUpdateSchema>;

// 获取单个租户详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ market_id: string; tenant_hash: string }> }
) {
  try {
    // 获取认证令牌
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      redirect('/login');
    }

    const { market_id, tenant_hash } = await params;

    const response = await fetch(
      `${process.env.BACKEND_API_URL}/api/v1/markets/${market_id}/tenants/${tenant_hash}`,
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
    logger.error('获取租户详情失败:', error);
    return NextResponse.json(
      { code: 500, message: '服务器内部错误', data: null },
      { status: 500 }
    );
  }
}

// 更新租户信息
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ market_id: string; tenant_hash: string }> }
) {
  try {
    // 获取认证令牌
    const authToken = request.cookies.get('auth-token')?.value;

    if (!authToken) {
      redirect('/login');
    }

    const { market_id, tenant_hash } = await params;
    const requestBody = await request.json();

    const response = await fetch(
      `${process.env.BACKEND_API_URL}/api/v1/tenants/${tenant_hash}`,
      {
        method: 'PATCH',
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
      logger.error('更新租户失败:', responseData.message);
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
        case 404:
          return NextResponse.json(
            {
              code: response.status,
              message: '租户不存在',
              data: null
            },
            { status: response.status }
          );
        case 409:
          return NextResponse.json(
            {
              code: response.status,
              message: '租户名称已被使用',
              data: null
            },
            { status: response.status }
          );
        default:
          return NextResponse.json(
            {
              code: response.status,
              message: responseData.message || '更新租户失败',
              data: null
            },
            { status: response.status }
          );
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('更新租户失败:', error);
    return NextResponse.json(
      { code: 500, message: '服务器内部错误', data: null },
      { status: 500 }
    );
  }
} 