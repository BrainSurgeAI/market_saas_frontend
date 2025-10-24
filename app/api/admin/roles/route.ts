import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// 模拟的角色数据
const mockRoles = [
    {
        id: 1,
        name: '超级管理员',
        code: 'super_admin',
        description: '系统超级管理员，拥有所有权限',
        priority: 100,
        isActive: true
    },
    {
        id: 2,
        name: '市场管理员',
        code: 'market_admin',
        description: '负责市场和租户管理',
        priority: 80,
        isActive: true
    },
    {
        id: 3,
        name: '报价员',
        code: 'pricer',
        description: '负责商品报价管理',
        priority: 60,
        isActive: true
    },
    {
        id: 4,
        name: '审计员',
        code: 'auditor',
        description: '负责系统审计和监督',
        priority: 50,
        isActive: true
    },
    {
        id: 5,
        name: '订单管理员（客户）',
        code: 'order_creator',
        description: '负责客户订单创建和管理',
        priority: 30,
        isActive: true
    },
    {
        id: 6,
        name: '订单管理员（市场）',
        code: 'order_publisher',
        description: '负责市场订单审核和发布',
        priority: 40,
        isActive: true
    },
    {
        id: 7,
        name: '供应商管理员',
        code: 'provider_admin',
        description: '负责供应商和配送员管理',
        priority: 45,
        isActive: true
    },
    {
        id: 8,
        name: '供应商',
        code: 'provider',
        description: '负责处理配送任务',
        priority: 10,
        isActive: true
    },
    {
        id: 9,
        name: '访客用户',
        code: 'guest',
        description: '基础访客权限',
        priority: 0,
        isActive: true
    }
];

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const activeOnly = searchParams.get('activeOnly');

        // 如果有activeOnly参数，只返回激活的角色
        let filteredRoles = mockRoles;
        if (activeOnly === 'true') {
            filteredRoles = mockRoles.filter(role => role.isActive);
        }

        logger.info(`获取角色列表 - 数量: ${filteredRoles.length}, 仅激活: ${activeOnly === 'true'}`);

        return NextResponse.json({
            code: 200,
            message: '获取角色列表成功',
            data: filteredRoles
        });
    } catch (error) {
        logger.error('获取角色列表出错:', error);
        return NextResponse.json(
            { message: '服务器内部错误' },
            { status: 500 }
        );
    }
}

/**
 * Create a new role
 * @param request
 * @returns
 */
export async function POST(request: NextRequest) {
	const body = await request.json();
	const response = await fetchRemoteData({
		endpoint: '/roles',
		method: 'POST',
		body: body,
		needToken: true,
		revalidate: 0
	});

	if (!response.success) {
		logger.error(`Failed to create role: ${response.error}`);
		return NextResponse.json(
			{ message: response.error },
			{ status: response.status }
		);
	}

	return NextResponse.json(response.data);
} 