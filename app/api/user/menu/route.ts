import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { fetchRemoteData } from '@/lib/api-utils';
import { jwtDecode } from 'jwt-decode';
import { TokenPayload } from '@/app/models';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken();

    // 解析token获取用户信息
    let userRoles: string[] = [];
    let tenantType = '';
    let primaryRole = '';

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      userRoles = decoded.roles || [];
      tenantType = decoded.tenant_type || '';
      primaryRole = userRoles.find(role => role && role.trim() !== '') || tenantType || '';

      logger.debug(`菜单API - 用户信息: roles=${JSON.stringify(userRoles)}, tenant_type=${tenantType}, primaryRole=${primaryRole}`);
    } catch (error) {
      logger.error('菜单API - 解析token失败:', error);
    }

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

      // 对于各种租户类型的用户，提供默认的菜单配置
      if (userRoles.includes('STAFF') ||
          userRoles.includes('ORDER_CREATOR') ||
          userRoles.includes('PRICER') ||
          userRoles.includes('AUDITOR') ||
          userRoles.includes('MARKET_ADMIN') ||
          tenantType === 'PROVIDER' ||
          tenantType === 'CUSTOMER' ||
          tenantType === 'MARKET') {
        let defaultMenuConfig = [];

        // 根据租户类型和角色提供不同的默认菜单
        if (tenantType === 'PROVIDER' || userRoles.includes('STAFF')) {
          defaultMenuConfig = [
            {
              title: "订单管理",
              url: `/workspace/providers/:provider_id/orders`,
              icon: "ShoppingCart",
              isActive: false,
              items: []
            },
            {
              title: "配送员工",
              url: `/workspace/providers/:provider_id/delivery_staffs`,
              icon: "Users",
              isActive: false,
              items: []
            },
            {
              title: "发票结算",
              url: `/workspace/providers/:provider_id/invoiceSettlements`,
              icon: "FileText",
              isActive: false,
              items: []
            }
          ];
        } else if (tenantType === 'CUSTOMER') {
          defaultMenuConfig = [
            {
              title: "订单管理",
              url: `/workspace/customers/:customer_id/orders`,
              icon: "ShoppingCart",
              isActive: false,
              items: []
            },
            {
              title: "发票结算",
              url: `/workspace/customers/:customer_id/invoiceSettlements`,
              icon: "FileText",
              isActive: false,
              items: []
            }
          ];
        } else if (tenantType === 'MARKET') {
          defaultMenuConfig = [
            {
              title: "订单管理",
              url: `/workspace/markets/:market_id/orders`,
              icon: "ShoppingCart",
              isActive: false,
              items: []
            },
            {
              title: "发票结算",
              url: `/workspace/markets/:market_id/invoiceSettlements`,
              icon: "FileText",
              isActive: false,
              items: []
            },
            {
              title: "租户管理",
              url: `/workspace/markets/:market_id/tenants`,
              icon: "Building",
              isActive: false,
              items: []
            }
          ];
        }

        logger.info(`为${tenantType}租户用户提供默认菜单配置，角色: ${JSON.stringify(userRoles)}`);

        return NextResponse.json({
          code: 200,
          message: 'success',
          data: {
            userRoles: userRoles.length > 0 ? userRoles : [tenantType],
            primaryRole: primaryRole,
            menuConfig: {
              teams: [{
                name: "邦来惠",
                logo: { name: "AudioWaveform" },
                plan: "集团",
              }],
              navMain: defaultMenuConfig,
              projects: []
            }
          }
        });
      }

      return NextResponse.json({
        code: 200,
        message: 'success',
        data: {
          userRoles: userRoles.length > 0 ? userRoles : ['USER'],
          primaryRole: primaryRole,
          menuConfig: null,
        }
      });
    }

    const result = await response.json();
    logger.debug(`后端API响应: ${JSON.stringify(result)}`);

    if (result.code === 200 && result.data) {
      const menuData = result.data;
      let convertedNavMain = menuData.menuConfig || [];

      // 如果后端没有返回菜单配置且是任何租户类型的用户，提供默认菜单
      if ((!convertedNavMain || convertedNavMain.length === 0) &&
          (userRoles.includes('STAFF') ||
           userRoles.includes('ORDER_CREATOR') ||
           userRoles.includes('PRICER') ||
           userRoles.includes('AUDITOR') ||
           userRoles.includes('MARKET_ADMIN') ||
           tenantType === 'PROVIDER' ||
           tenantType === 'CUSTOMER' ||
           tenantType === 'MARKET')) {
        // 根据租户类型和角色提供不同的默认菜单
        if (tenantType === 'PROVIDER' || userRoles.includes('STAFF')) {
          convertedNavMain = [
            {
              title: "订单管理",
              url: `/workspace/providers/:provider_id/orders`,
              icon: "ShoppingCart",
              isActive: false,
              items: []
            },
            {
              title: "配送员工",
              url: `/workspace/providers/:provider_id/delivery_staffs`,
              icon: "Users",
              isActive: false,
              items: []
            },
            {
              title: "发票结算",
              url: `/workspace/providers/:provider_id/invoiceSettlements`,
              icon: "FileText",
              isActive: false,
              items: []
            }
          ];
        } else if (tenantType === 'CUSTOMER') {
          convertedNavMain = [
            {
              title: "订单管理",
              url: `/workspace/customers/:customer_id/orders`,
              icon: "ShoppingCart",
              isActive: false,
              items: []
            },
            {
              title: "发票结算",
              url: `/workspace/customers/:customer_id/invoiceSettlements`,
              icon: "FileText",
              isActive: false,
              items: []
            }
          ];
        } else if (tenantType === 'MARKET') {
          convertedNavMain = [
            {
              title: "订单管理",
              url: `/workspace/markets/:market_id/orders`,
              icon: "ShoppingCart",
              isActive: false,
              items: []
            },
            {
              title: "发票结算",
              url: `/workspace/markets/:market_id/invoiceSettlements`,
              icon: "FileText",
              isActive: false,
              items: []
            },
            {
              title: "租户管理",
              url: `/workspace/markets/:market_id/tenants`,
              icon: "Building",
              isActive: false,
              items: []
            }
          ];
        }

        logger.info(`后端无菜单配置，为${tenantType}租户用户提供默认菜单，角色: ${JSON.stringify(userRoles)}`);
      }

      // 确保数据结构符合前端期望
      const adaptedData = {
        userRoles: (menuData.userRoles && menuData.userRoles.length > 0) ? menuData.userRoles : (userRoles.length > 0 ? userRoles : [tenantType]),
        primaryRole: menuData.primaryRole || primaryRole,
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