import { Organization } from "@/app/models";
import { LucideIcon, SquareTerminal, AudioWaveform, Frame, PieChart, Building, Database, Server } from "lucide-react"
import { MenuRole, RoleMenuConfig, DynamicMenuData } from "@/types/menuTypes";
import { getIcon } from "./utils/iconMap";

export type UserRole = string; // 改为动态类型，不再硬编码

// 定义菜单项的类型
export interface MenuItem {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
    }[];
}

// 定义不同角色的菜单映射
const roleMenuMap: Record<UserRole, MenuItem[]> = {
    super_admin: [
        {
            title: "系统管理",
            url: "/workspace",
            icon: SquareTerminal,
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
            icon: Database,
            items: [
                {
                    title: "数据概览",
                    url: "/workspace/data/overview",
                },
                {
                    title: "数据分析",
                    url: "/workspace/data/analysis",
                },
            ],
        },
        {
            title: "服务监控",
            url: "",
            icon: Server,
            items: [
                {
                    title: "服务状态",
                    url: "/workspace/services/status",
                },
                {
                    title: "性能监控",
                    url: "/workspace/services/performance",
                },
            ],
        },
    ],
    market_admin: [
        {
            title: "组织管理",
            url: "/workspace",
            icon: Building,
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
            icon: Frame,
            items: [
                {
                    title: "结算单",
                    url: "/workspace/invoiceSettlements",
                },
            ],
        },
    ],

    pricer: [
        {
            title: "工作台",
            url: "/workspace",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "报价管理",
                    url: "/workspace/organizations/:org_name/product_prices",
                }
            ],
        },
    ],
    auditor: [
        {
            title: "工作台",
            url: "/workspace",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "报价管理",
                    url: "/workspace/organizations/:org_name/product_prices",
                },
                {
                    title: "商品管理",
                    url: "/workspace/organizations/:org_name/products",
                }
            ],
        },

    ],
    // 客户订单管理员
    order_creator: [
        {
            title: "工作台",
            url: "/workspace",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "订单管理",
                    url: "/workspace/customers/:customer_id/orders",
                },
                {
                    title: "去采购",
                    url: "/workspace",
                },
                {
                    title: "结算单",
                    url: "/workspace/customers/:customer_id/invoiceSettlements",
                },
            ],
        },

    ],
    // 市场订单管理员
    order_publisher: [
        {
            title: "工作台",
            url: "/workspace",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "订单管理",
                    url: "/workspace/markets/:market_id/orders",
                },
                {
                    title: "结算单",
                    url: "/workspace/markets/:market_id/invoiceSettlements",
                },
            ],
        },

    ],

    provider_admin: [
        {
            title: "工作台",
            url: "/workspace",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "订单管理",
                    url: "/workspace/providers/:provider_id/orders",
                },
                {
                    title: "配送员管理",
                    url: "/workspace/providers/:provider_id/delivery_staffs",
                },
            ],
        },
    ],
    provider: [
        {
            title: "工作台",
            url: "/workspace",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "订单管理",
                    url: "/workspace/providers/:provider_id/orders",
                },
                {
                    title: "结算单",
                    url: "/workspace/providers/:provider_id/invoiceSettlements",
                },
              
            ],
        },

    ],
    guest: [
        {
            title: "工作台",
            url: "/workspace",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "组织信息",
                    url: "/workspace/organizations",
                },
            ],
        },
    ],
};

const baseTeams = [
    {
        name: "邦来惠",
        logo: { name: "AudioWaveform" },
        plan: "集团",
    },
];

const baseProjects = [
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
];



/**
 * 将动态菜单数据转换为MenuItem格式
 */
function convertDynamicMenuItems(dynamicItems: any[]): MenuItem[] {
    return dynamicItems.map(item => ({
        title: item.title,
        url: item.url,
        icon: getIcon(item.icon || 'SquareTerminal'),
        isActive: item.is_active,
        items: item.items?.map((subItem: any) => ({
            title: subItem.title,
            url: subItem.url,
            icon: subItem.icon,
            id: subItem.id,
            is_active: subItem.is_active
        }))
    }));
}

/**
 * 获取用户的角色信息（从远程API）
 */
export async function getUserRoles(): Promise<MenuRole[]> {
    try {
        const response = await fetch('/api/admin/roles?activeOnly=true', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch roles');
        }

        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('获取角色信息失败:', error);
        return [];
    }
}

/**
 * 获取指定角色的菜单配置（从远程API）
 */
export async function getRoleMenuConfig(roleId: number): Promise<MenuItem[]> {
    try {
        const response = await fetch(`/api/admin/menu-config?roleId=${roleId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch menu config');
        }

        const result = await response.json();
        if (result.data && result.data.menuItems) {
            return convertDynamicMenuItems(result.data.menuItems);
        }
        return [];
    } catch (error) {
        console.error('获取菜单配置失败:', error);
        return [];
    }
}

/**
 * 获取当前用户的菜单配置（优先使用用户专用API）
 */
export async function getUserMenuConfig(): Promise<{
    userRoles: string[];
    primaryRole: string;
    menuConfig: {
        teams: any[];
        navMain: any[];
        projects: any[];
    };
} | null> {
    try {
        const response = await fetch('/api/user/menu', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user menu config');
        }

        const result = await response.json();
        if (result.code === 200 && result.data) {
            // 转换菜单项格式 - 后端返回的menuConfig.navMain就是我们要的菜单数据
            const convertedNavMain = convertDynamicMenuItems(result.data.menuConfig.navMain);

            return {
                userRoles: result.data.userRoles,
                primaryRole: result.data.primaryRole,
                menuConfig: {
                    teams: result.data.menuConfig.teams,
                    navMain: convertedNavMain,
                    projects: result.data.menuConfig.projects,
                }
            };
        }
        return null;
    } catch (error) {
        console.error('获取用户菜单配置失败:', error);
        return null;
    }
}

/**
 * 根据用户角色获取导航数据（支持动态菜单）
 */
export async function getNavData(organization: Organization, roles: string[]): Promise<{
    teams: any[];
    navMain: MenuItem[];
    projects: any[];
}> {
    // 优先使用用户专用菜单API
    try {
        const userMenuConfig = await getUserMenuConfig();

        if (userMenuConfig && userMenuConfig.menuConfig.navMain.length > 0) {
            // 使用用户专用菜单
            const navData = {
                teams: userMenuConfig.menuConfig.teams,
                navMain: deepCloneMenuItems(userMenuConfig.menuConfig.navMain),
                projects: userMenuConfig.menuConfig.projects,
            };

            // 替换URL中的占位符
            replaceUrlPlaceholders(navData.navMain, organization);
            console.log(`使用用户专用菜单 - 主角色: ${userMenuConfig.primaryRole}, 菜单项: ${navData.navMain.length}`);
            return navData;
        }
    } catch (error) {
        console.error('获取用户专用菜单失败，尝试其他方式:', error);
    }

    // 回退方案1：尝试从远程API获取角色菜单配置
    try {
        const allRoles = await getUserRoles();
        const userRoleObjects = allRoles.filter(role =>
            roles.some(userRole => userRole.toLowerCase() === role.code.toLowerCase())
        );

        // 按优先级排序，获取最高优先级的角色
        const sortedRoles = userRoleObjects.sort((a, b) => b.priority - a.priority);
        const primaryRole = sortedRoles[0];

        if (primaryRole) {
            const dynamicMenuItems = await getRoleMenuConfig(primaryRole.id);

            if (dynamicMenuItems.length > 0) {
                // 使用动态菜单
                const navData = {
                    teams: [...baseTeams.slice(0, 1)],
                    navMain: deepCloneMenuItems(dynamicMenuItems),
                    projects: [...baseProjects],
                };

                // 替换URL中的占位符
                replaceUrlPlaceholders(navData.navMain, organization);
                console.log(`使用角色菜单配置 - 角色: ${primaryRole.name}, 菜单项: ${navData.navMain.length}`);
                return navData;
            }
        }
    } catch (error) {
        console.error('获取角色菜单配置失败，使用静态菜单:', error);
    }

    // 回退方案2：使用静态菜单
    console.log('使用静态菜单配置');
    return getStaticNavData(organization, roles);
}

/**
 * 获取静态导航数据（原有逻辑作为后备）
 */
function getStaticNavData(organization: Organization, roles: string[]) {
    const userRoles = roles.map(role => {
        const normalizedRole = role.toLowerCase();
        return normalizedRole;
    });

    // 获取基础菜单
    let navData;

    // 根据角色优先级选择菜单
    if (userRoles.includes('super_admin')) {
        navData = {
            teams: [...baseTeams],
            navMain: deepCloneMenuItems(roleMenuMap.super_admin),
            projects: [...baseProjects],
        };
    } else if (userRoles.includes('pricer')) {
        const pricerRole = userRoles.includes('pricer') ? 'pricer' : 'guest';
        navData = {
            teams: [...baseTeams],
            navMain: deepCloneMenuItems(roleMenuMap[pricerRole]),
            projects: [...baseProjects],
        };
    } else if (userRoles.includes('auditor')) {
        const auditorRole = userRoles.includes('auditor') ? 'auditor' : 'guest';
        navData = {
            teams: [...baseTeams.slice(0, 1)],
            navMain: deepCloneMenuItems(roleMenuMap[auditorRole]),
            projects: [...baseProjects],
        };
    }
    else if (userRoles.includes('market_admin')) {
        const orgAdminRole = userRoles.includes('market_admin') ? 'market_admin' : 'guest';
        navData = {
            teams: [...baseTeams.slice(0, 1)],
            navMain: deepCloneMenuItems(roleMenuMap[orgAdminRole]),
            projects: [...baseProjects],
        };
    } else if (userRoles.includes('order_creator')) {
        const orderCreatorRole = userRoles.includes('order_creator') ? 'order_creator' : 'guest';
        navData = {
            teams: [...baseTeams.slice(0, 1)],
            navMain: deepCloneMenuItems(roleMenuMap[orderCreatorRole]),
            projects: [...baseProjects],
        };
    } else if (userRoles.includes('provider')) {
        const providerRole = userRoles.includes('provider') ? 'provider' : 'guest';
        navData = {
            teams: [...baseTeams.slice(0, 1)],
            navMain: deepCloneMenuItems(roleMenuMap[providerRole]),
            projects: [...baseProjects],
        };
    } else if (userRoles.includes('order_publisher')) {
        const orderPublisherRole = userRoles.includes('order_publisher') ? 'order_publisher' : 'guest';
        navData = {
            teams: [...baseTeams.slice(0, 1)],
            navMain: deepCloneMenuItems(roleMenuMap[orderPublisherRole]),
            projects: [...baseProjects],
        };
    } else if (userRoles.includes('provider_admin')) {
        const providerAdminRole = userRoles.includes('provider_admin') ? 'provider_admin' : 'guest';
        navData = {
            teams: [...baseTeams.slice(0, 1)],
            navMain: deepCloneMenuItems(roleMenuMap[providerAdminRole]),
            projects: [...baseProjects],
        };
    } else {
        navData = {
            teams: [...baseTeams.slice(0, 1)],
            navMain: deepCloneMenuItems(roleMenuMap.guest),
            projects: [],
        };
    }

    // 替换URL中的占位符
    replaceUrlPlaceholders(navData.navMain, organization);

    return navData;
}

/**
 * 替换菜单URL中的占位符
 */
function replaceUrlPlaceholders(menuItems: MenuItem[], organization: Organization) {
    menuItems.forEach((menuItem: MenuItem) => {
        console.log('Processing menu item:', organization.nameHash, menuItem.url);
        menuItem.url = menuItem.url.replace(':org_name', organization.nameHash);

        if (menuItem.items) {
            menuItem.items.forEach(subItem => {
                subItem.url = subItem.url
                    .replace(':org_name', organization.nameHash)
                    .replace(':customer_id', organization.nameHash)
                    .replace(':provider_id', organization.nameHash)
                    .replace(':market_id', organization.nameHash);
            });
        }
    });
}

/**
 * 同步版本的getNavData（保持向后兼容）
 */
export const getNavDataSync = getStaticNavData;

function deepCloneMenuItems(items: MenuItem[]): MenuItem[] {
    return items.map(item => ({
        ...item,
        items: item.items ? [...item.items] : undefined,
    }));
}