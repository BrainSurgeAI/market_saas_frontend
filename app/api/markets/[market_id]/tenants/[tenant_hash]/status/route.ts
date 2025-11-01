import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// 租户状态更新验证模式
// export const tenantStatusSchema = z.object({
//   isDisabled: z.boolean(),
// });

//type TenantStatusRequest = z.infer<typeof tenantStatusSchema>;

// 更新租户状态（启用/禁用）
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

    logger.info(JSON.stringify(requestBody));
    
    // 构建请求体，根据isDisabled决定是禁用还是启用
    const apiRequestBody = {
      is_deleted: requestBody.isDisabled
    };

    const response = await fetch(
      `${process.env.BACKEND_API_URL}/api/v1/tenants/${tenant_hash}/activate-or-deactivate`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'gzip'
        },
        body: JSON.stringify(apiRequestBody),
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      logger.error('更新租户状态失败:', responseData.message);
      switch (response.status) {
        case 404:
          return NextResponse.json(
            {
              code: response.status,
              message: '租户不存在',
              data: null
            },
            { status: response.status }
          );
        default:
          return NextResponse.json(
            {
              code: response.status,
              message: responseData.message || '更新租户状态失败',
              data: null
            },
            { status: response.status }
          );
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('更新租户状态失败:', error);
    return NextResponse.json(
      { code: 500, message: '服务器内部错误', data: null },
      { status: 500 }
    );
  }
} 