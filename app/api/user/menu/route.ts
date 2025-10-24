import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { fetchRemoteData } from '@/lib/api-utils';

// 模拟的用户菜单配置数据
const mockUserMenuData = {
  // 超级管理员菜单
  super_admin: {
    teams: [
      {
        name: "邦来惠",
        logo: { name: "AudioWaveform" },
        plan: "集团",
      }
    ],
    navMain: [
      {
        title: "系统管理",
        url: "/workspace",
        icon: { name: "SquareTerminal" },
        isActive: true,
        items: [
          {
            title: "组织管理",
            url: "/workspace/organizations",
          },
          {
            title: "用户管理",
            url: "/workspace/users",
          },
          {
            title: "角色管理",
            url: "/workspace/roles",
          },
          {
            title: "权限管理",
            url: "/workspace/permissions",
          },
          {
            title: "菜单管理",
            url: "/workspace/menu",
          },
          {
            title: "系统设置",
            url: "/workspace/settings",
          },
          {
            title: "日志审计",
            url: "/workspace/logs",
          },
        ],
      },
      {
        title: "数据中心",
        url: "",
        icon: { name: "Database" },
        items: [
          {
            title: "数据概览",
            url: "/workspace/data/overview",
          },
          {
            title: "数据分析",
            url: "/workspace/data/analysis",
          },
          {
            title: "数据报表",
            url: "/workspace/data/reports",
          },
        ],
      },
      {
        title: "服务监控",
        url: "",
        icon: { name: "Server" },
        items: [
          {
            title: "服务状态",
            url: "/workspace/services/status",
          },
          {
            title: "性能监控",
            url: "/workspace/services/performance",
          },
          {
            title: "错误日志",
            url: "/workspace/services/logs",
          },
        ],
      },
    ],
    projects: [
      {
        name: "Design Engineering",
        url: "#",
        icon: { name: "Frame" },
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: { name: "PieChart" },
      },
    ],
  },

  // 市场管理员菜单
  market_admin: {
    teams: [
      {
        name: "邦来惠",
        logo: { name: "AudioWaveform" },
        plan: "集团",
      }
    ],
    navMain: [
      {
        title: "组织管理",
        url: "/workspace",
        icon: { name: "Building" },
        isActive: true,
        items: [
          {
            title: "租户管理",
            url: "/workspace/markets/:market_id/tenants",
          },
          {
            title: "成员管理",
            url: "/workspace/organization/members",
          },
          {
            title: "部门设置",
            url: "/workspace/organization/departments",
          },
        ],
      },
      {
        title: "数据管理",
        url: "",
        icon: { name: "Frame" },
        items: [
          {
            title: "结算单",
            url: "/workspace/invoiceSettlements",
          },
          {
            title: "财务报表",
            url: "/workspace/financial/reports",
          },
        ],
      },
    ],
    projects: [
      {
        name: "Market Analytics",
        url: "#",
        icon: { name: "BarChart3" },
      },
    ],
  },

  // 报价员菜单
  pricer: {
    teams: [
      {
        name: "邦来惠",
        logo: { name: "AudioWaveform" },
        plan: "集团",
      }
    ],
    navMain: [
      {
        title: "工作台",
        url: "/workspace",
        icon: { name: "SquareTerminal" },
        isActive: true,
        items: [
          {
            title: "报价管理",
            url: "/workspace/organizations/:org_name/product_prices",
          },
          {
            title: "价格分析",
            url: "/workspace/price-analysis",
          },
        ],
      },
      {
        title: "产品管理",
        url: "",
        icon: { name: "Package" },
        items: [
          {
            title: "商品列表",
            url: "/workspace/products",
          },
          {
            title: "分类管理",
            url: "/workspace/categories",
          },
        ],
      },
    ],
    projects: [],
  },

  // 审计员菜单
  auditor: {
    teams: [
      {
        name: "邦来惠",
        logo: { name: "AudioWaveform" },
        plan: "集团",
      }
    ],
    navMain: [
      {
        title: "工作台",
        url: "/workspace",
        icon: { name: "SquareTerminal" },
        isActive: true,
        items: [
          {
            title: "报价管理",
            url: "/workspace/organizations/:org_name/product_prices",
          },
          {
            title: "商品管理",
            url: "/workspace/organizations/:org_name/products",
          },
          {
            title: "审计日志",
            url: "/workspace/audit/logs",
          },
        ],
      },
    ],
    projects: [],
  },

  // 默认菜单（访客）
  guest: {
    teams: [
      {
        name: "邦来惠",
        logo: { name: "AudioWaveform" },
        plan: "集团",
      }
    ],
    navMain: [
      {
        title: "工作台",
        url: "/workspace",
        icon: { name: "SquareTerminal" },
        isActive: true,
        items: [
          {
            title: "组织信息",
            url: "/workspace/organizations",
          },
          {
            title: "个人设置",
            url: "/workspace/profile",
          },
        ],
      },
    ],
    projects: [],
  },
};

export async function GET(request: NextRequest) {
  try {
    // 获取用户token
    const token = await getToken();

    // 调用实际的后端API
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/menus`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      logger.error(`后端API请求失败: ${response.status} ${response.statusText}`);

      // 如果后端API不可用，返回模拟数据作为降级方案
      logger.info('后端API不可用，使用模拟数据作为降级方案');
      const fallbackData = mockUserMenuData.super_admin;

      return NextResponse.json({
        code: 200,
        message: '获取用户菜单配置成功（使用模拟数据）',
        data: {
          userRoles: ['super_admin'],
          primaryRole: 'super_admin',
          menuConfig: fallbackData,
        }
      });
    }

    const result = await response.json();
    logger.info('后端API响应:', JSON.stringify(result, null, 2));

    // 适配后端返回的数据结构
    if (result.code === 200 && result.data) {
      const menuData = result.data;

      // 后端返回的menuConfig是数组，需要转换为前端期望的格式
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

      logger.info('成功获取用户菜单配置，角色:', adaptedData.userRoles);
      logger.info('菜单项数量:', adaptedData.menuConfig.navMain.length);

      return NextResponse.json({
        code: 200,
        message: '获取用户菜单配置成功',
        data: adaptedData
      });
    } else {
      logger.error('后端API返回数据格式错误:', result);

      // 使用模拟数据作为降级方案
      const fallbackData = mockUserMenuData.super_admin;

      return NextResponse.json({
        code: 200,
        message: '获取用户菜单配置成功（使用模拟数据）',
        data: {
          userRoles: ['super_admin'],
          primaryRole: 'super_admin',
          menuConfig: fallbackData,
        }
      });
    }

  } catch (error) {
    logger.error('获取用户菜单配置出错:', error);

    // 如果发生错误，返回模拟数据作为降级方案
    logger.info('发生错误，使用模拟数据作为降级方案');
    const fallbackData = mockUserMenuData.super_admin;

    return NextResponse.json({
      code: 200,
      message: '获取用户菜单配置成功（使用模拟数据）',
      data: {
        userRoles: ['super_admin'],
        primaryRole: 'super_admin',
        menuConfig: fallbackData,
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