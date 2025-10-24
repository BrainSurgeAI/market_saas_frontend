import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// 模拟的菜单配置数据
const mockMenuConfigs = {
    // 超级管理员菜单配置
    1: {
        roleId: 1,
        menuItems: [
            {
                title: "系统管理",
                url: "/workspace",
                icon: { name: "SquareTerminal" },
                isActive: true,
                items: [
                    { title: "组织管理", url: "/workspace/organizations" },
                    { title: "用户管理", url: "/workspace/users" },
                    { title: "角色管理", url: "/workspace/roles" },
                    { title: "权限管理", url: "/workspace/permissions" },
                    { title: "菜单管理", url: "/workspace/menu" },
                    { title: "系统设置", url: "/workspace/settings" },
                    { title: "日志审计", url: "/workspace/logs" },
                ]
            },
            {
                title: "数据中心",
                url: "",
                icon: { name: "Database" },
                isActive: true,
                items: [
                    { title: "数据概览", url: "/workspace/data/overview" },
                    { title: "数据分析", url: "/workspace/data/analysis" },
                    { title: "数据报表", url: "/workspace/data/reports" },
                ]
            },
            {
                title: "服务监控",
                url: "",
                icon: { name: "Server" },
                isActive: true,
                items: [
                    { title: "服务状态", url: "/workspace/services/status" },
                    { title: "性能监控", url: "/workspace/services/performance" },
                    { title: "错误日志", url: "/workspace/services/logs" },
                ]
            },
        ]
    },
    // 市场管理员菜单配置
    2: {
        roleId: 2,
        menuItems: [
            {
                title: "组织管理",
                url: "/workspace",
                icon: { name: "Building" },
                isActive: true,
                items: [
                    { title: "租户管理", url: "/workspace/markets/:market_id/tenants" },
                    { title: "成员管理", url: "/workspace/organization/members" },
                    { title: "部门设置", url: "/workspace/organization/departments" },
                ]
            },
            {
                title: "数据管理",
                url: "",
                icon: { name: "Frame" },
                isActive: true,
                items: [
                    { title: "结算单", url: "/workspace/invoiceSettlements" },
                    { title: "财务报表", url: "/workspace/financial/reports" },
                ]
            }
        ]
    },
    // 报价员菜单配置
    3: {
        roleId: 3,
        menuItems: [
            {
                title: "工作台",
                url: "/workspace",
                icon: { name: "SquareTerminal" },
                isActive: true,
                items: [
                    { title: "报价管理", url: "/workspace/organizations/:org_name/product_prices" },
                    { title: "价格分析", url: "/workspace/price-analysis" },
                ]
            },
            {
                title: "产品管理",
                url: "",
                icon: { name: "Package" },
                isActive: true,
                items: [
                    { title: "商品列表", url: "/workspace/products" },
                    { title: "分类管理", url: "/workspace/categories" },
                ]
            }
        ]
    },
    // 审计员菜单配置
    4: {
        roleId: 4,
        menuItems: [
            {
                title: "工作台",
                url: "/workspace",
                icon: { name: "SquareTerminal" },
                isActive: true,
                items: [
                    { title: "报价管理", url: "/workspace/organizations/:org_name/product_prices" },
                    { title: "商品管理", url: "/workspace/organizations/:org_name/products" },
                    { title: "审计日志", url: "/workspace/audit/logs" },
                ]
            }
        ]
    },
    // 默认访客菜单配置
    9: {
        roleId: 9,
        menuItems: [
            {
                title: "工作台",
                url: "/workspace",
                icon: { name: "SquareTerminal" },
                isActive: true,
                items: [
                    { title: "组织信息", url: "/workspace/organizations" },
                    { title: "个人设置", url: "/workspace/profile" },
                ]
            }
        ]
    }
};

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const roleId = searchParams.get('roleId');

        let responseData;
        if (roleId) {
            // 返回指定角色的菜单配置
            const config = mockMenuConfigs[parseInt(roleId)];
            if (config) {
                responseData = {
                    code: 200,
                    message: `获取角色${roleId}菜单配置成功`,
                    data: config
                };
            } else {
                responseData = {
                    code: 404,
                    message: '未找到该角色的菜单配置'
                };
            }
        } else {
            // 返回所有菜单配置
            responseData = {
                code: 200,
                message: '获取所有菜单配置成功',
                data: Object.values(mockMenuConfigs)
            };
        }

        logger.info(`获取菜单配置 - 角色ID: ${roleId}, 响应状态: ${responseData.code}`);

        return NextResponse.json(responseData);
    } catch (error) {
        logger.error('获取菜单配置出错:', error);
        return NextResponse.json(
            { message: '服务器内部错误' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const response = await fetchRemoteData({
			endpoint: '/menu-config',
			method: 'POST',
			body: body,
			revalidate: 0
		});

		if (!response.success) {
			return NextResponse.json(
				{ message: response.error },
				{ status: response.status }
			);
		}

		return NextResponse.json({
			code: 200,
			message: '菜单配置创建成功',
			data: response.data
		});
	} catch (error) {
		logger.error('创建菜单配置出错:', error);
		return NextResponse.json(
			{ message: '服务器内部错误' },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();

		const response = await fetchRemoteData({
			endpoint: '/menu-config',
			method: 'PUT',
			body: body,
			revalidate: 0
		});

		if (!response.success) {
			return NextResponse.json(
				{ message: response.error },
				{ status: response.status }
			);
		}

		return NextResponse.json({
			code: 200,
			message: '菜单配置更新成功',
			data: response.data
		});
	} catch (error) {
		logger.error('更新菜单配置出错:', error);
		return NextResponse.json(
			{ message: '服务器内部错误' },
			{ status: 500 }
		);
	}
}