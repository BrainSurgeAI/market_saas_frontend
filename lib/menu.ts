import { Organization } from "@/app/models";
import { LucideIcon, SquareTerminal, AudioWaveform, Frame, PieChart, Building, Database, Server } from "lucide-react"
import { Role, RoleMenuConfig, DynamicMenuData } from "@/app/types/menuTypes";
import { getIcon } from "./iconMap";
import { getMenuCache, setMenuCache } from "./menuCache";

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
    console.log('🔄 convertDynamicMenuItems 输入:', {
        输入类型: Array.isArray(dynamicItems) ? 'array' : typeof dynamicItems,
        输入长度: Array.isArray(dynamicItems) ? dynamicItems.length : 'N/A',
        输入数据: dynamicItems
    });

    if (!Array.isArray(dynamicItems)) {
        console.warn('⚠️ convertDynamicMenuItems 收到非数组输入，返回空数组');
        return [];
    }

    const result = dynamicItems.map(item => {
        console.log('🔧 处理菜单项:', item);
        return {
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
        };
    });

    console.log('✅ convertDynamicMenuItems 输出:', {
        输出长度: result.length,
        输出数据: result
    });

    return result;
}

/**
 * 获取用户的角色信息（从远程API）
 */
export async function getUserRoles(): Promise<Role[]> {
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
 * 获取当前用户的菜单配置（优先使用缓存，然后使用用户专用API）
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
        console.log('🍔 getUserMenuConfig 开始执行...');

        // 首先尝试从 localStorage 获取用户主角色
        const storedRoles = localStorage.getItem('user-roles');
        const roles = storedRoles ? JSON.parse(storedRoles) : [];

        console.log('👥 用户角色:', roles);

        if (roles.length > 0) {
            // 尝试使用第一个角色作为主角色来查找缓存
            const primaryRole = roles[0];
            console.log(`🎯 主角色: ${primaryRole}`);

            const cachedMenu = getMenuCache(primaryRole);

            if (cachedMenu) {
                console.log(`✅ 使用角色 ${primaryRole} 的缓存菜单`);
                console.log('📋 缓存菜单数据:', {
                    userRoles: cachedMenu.userRoles,
                    primaryRole: cachedMenu.primaryRole,
                    navMainLength: cachedMenu.menuConfig?.navMain?.length || 0
                });

                // 转换菜单项格式
                const convertedNavMain = convertDynamicMenuItems(cachedMenu.menuConfig.navMain);
                console.log('🔄 转换后的菜单项数量:', convertedNavMain.length);

                return {
                    userRoles: cachedMenu.userRoles,
                    primaryRole: cachedMenu.primaryRole,
                    menuConfig: {
                        teams: cachedMenu.menuConfig.teams,
                        navMain: convertedNavMain,
                        projects: cachedMenu.menuConfig.projects,
                    }
                };
            } else {
                console.log(`❌ 角色 ${primaryRole} 没有找到缓存`);
            }
        } else {
            console.log('❌ 没有找到用户角色信息');
        }

        // 缓存未命中，从服务器获取
        console.log('🌐 缓存未命中，从服务器获取菜单');
        const response = await fetch('/api/user/menu', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        console.log('📡 API响应状态:', response.status);

        if (!response.ok) {
            console.error('❌ API请求失败:', response.status);
            throw new Error('Failed to fetch user menu config');
        }

        const result = await response.json();
        console.log('📦 API响应数据:', result);

        if (result.code === 200 && result.data) {
            console.log('✅ API返回成功，处理菜单数据...');
            console.log('📋 原始菜单项数量:', result.data.menuConfig?.navMain?.length || 0);

            // 转换菜单项格式 - 后端返回的menuConfig.navMain就是我们要的菜单数据
            const convertedNavMain = convertDynamicMenuItems(result.data.menuConfig.navMain);
            console.log('🔄 转换后菜单项数量:', convertedNavMain.length);

            const menuData = {
                userRoles: result.data.userRoles,
                primaryRole: result.data.primaryRole,
                menuConfig: {
                    teams: result.data.menuConfig.teams,
                    navMain: result.data.menuConfig.navMain, // 存储原始数据，不转换
                    projects: result.data.menuConfig.projects,
                }
            };

            // 缓存菜单数据
            console.log('💾 缓存菜单数据，角色:', result.data.primaryRole);
            setMenuCache(result.data.primaryRole, menuData);

            // 返回转换后的数据
            const finalData = {
                userRoles: result.data.userRoles,
                primaryRole: result.data.primaryRole,
                menuConfig: {
                    teams: result.data.menuConfig.teams,
                    navMain: convertedNavMain,
                    projects: result.data.menuConfig.projects,
                }
            };

            console.log('✅ 最终返回的菜单数据:', {
                userRoles: finalData.userRoles,
                primaryRole: finalData.primaryRole,
                navMainLength: finalData.menuConfig.navMain.length
            });

            return finalData;
        }

        console.log('❌ API返回的数据格式不正确');
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
    console.log('🚀 getNavData 开始执行...');
    console.log('🏢 组织信息:', organization);
    console.log('👥 用户角色:', roles);

    // 优先使用用户专用菜单API
    try {
        console.log('📞 调用 getUserMenuConfig...');
        const userMenuConfig = await getUserMenuConfig();

        console.log('📦 getUserMenuConfig 返回:', userMenuConfig);

        if (userMenuConfig && userMenuConfig.menuConfig.navMain.length > 0) {
            // 使用用户专用菜单
            const navData = {
                teams: userMenuConfig.menuConfig.teams,
                navMain: deepCloneMenuItems(userMenuConfig.menuConfig.navMain),
                projects: userMenuConfig.menuConfig.projects,
            };

            // 替换URL中的占位符
            replaceUrlPlaceholders(navData.navMain, organization);
            console.log(`✅ 使用用户专用菜单 - 主角色: ${userMenuConfig.primaryRole}, 菜单项: ${navData.navMain.length}`);
            console.log('📋 最终菜单数据:', navData);
            return navData;
        } else {
            console.log('❌ 用户菜单配置为空或菜单项为0，尝试其他方式');
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