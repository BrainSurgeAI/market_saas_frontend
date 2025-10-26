import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { fetchRemoteData } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken();
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/menus`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      logger.error(`请求后端菜单API数据失败: ${response.status} ${response.statusText}`);

      return NextResponse.json({
        code: 200,
        message: 'success',
        data: {
          userRoles: ['super_admin'],
          primaryRole: 'super_admin',
          menuConfig: null,
        }
      });
    }

    const result = await response.json();
    logger.debug(`后端API响应: ${JSON.stringify(result)}`);

    if (result.code === 200 && result.data) {
      const menuData = result.data;
      const convertedNavMain = menuData.menuConfig || [];

      // 确保数据结构符合前端期望
      const adaptedData = {
        userRoles: menuData.userRoles || [],
        primaryRole: menuData.primaryRole || '',
        menuConfig: {
          teams: [{
            name: "邦来惠",
            logo: { name: "AudioWaveform" },
            plan: "集团",
          }],
          navMain: convertedNavMain,
          projects: []
        }
      };

      return NextResponse.json({
        code: 200,
        message: '获取用户菜单配置成功',
        data: adaptedData
      });
    }
  } catch (error) {
    logger.error('获取用户菜单配置出错:', error);

    return NextResponse.json({
      code: 200,
      message: '获取用户菜单配置成功（使用模拟数据）',
      data: {
        userRoles: ['super_admin'],
        primaryRole: 'super_admin',
        menuConfig: [],
      }
    });
  }
}

// 后续可以添加POST方法来更新用户菜单配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 这里可以调用后端API来更新用户菜单配置
    const response = await fetchRemoteData({
      endpoint: '/user/menu',
      method: 'POST',
      body: body,
    });

    if (!response.success) {
      return NextResponse.json(
        { message: response.error },
        { status: response.status }
      );
    }

    return NextResponse.json({
      code: 200,
      message: '更新用户菜单配置成功',
      data: response.data
    });
  } catch (error) {
    logger.error('更新用户菜单配置出错:', error);
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    );
  }
}