import { Organization } from "@/app/models";
import {
    AudioWaveform,
    Frame,
    PieChart,
    SquareTerminal,
    Building,
    Database,
    Server,
    LucideIcon
} from "lucide-react"

export type UserRole = 'super_admin' | 'market_admin' | 'provider_admin' | 'auditor' | 'pricer' | 'order_creator' | 'order_publisher' |'provider' |'guest';

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
        logo: AudioWaveform,
        plan: "集团",
    },
];

const baseProjects = [
    {
        name: "Design Engineering",
        url: "#",
        icon: Frame,
    },
    {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
    },
];



export const getNavData = (organization: Organization, roles: string[]) => {
    
    const userRoles = roles.map(role => {
        const normalizedRole = role.toLowerCase();
        return normalizedRole as UserRole;
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

    

    navData.navMain.forEach((menuItem: MenuItem) => {
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

    return navData;
};

function deepCloneMenuItems(items: MenuItem[]): MenuItem[] {
    return items.map(item => ({
        ...item,
        items: item.items ? [...item.items] : undefined,
    }));
}