// 动态菜单相关类型定义

export interface MenuIcon {
  name: string;
  // 图标名称，对应Lucide React图标
}

export interface SubMenuItem {
  title: string;
  url: string;
  icon?: string | null;
  id?: number;
  is_active?: boolean;
}

export interface MenuItem {
  title: string;
  url: string;
  icon: string | null;
  id?: number;
  is_active?: boolean;
  items?: SubMenuItem[];
}

export interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  priority: number; // 角色优先级，数字越大优先级越高
  isActive: boolean;
}

export interface RoleMenuConfig {
  roleId: number;
  menuItems: MenuItem[];
}

export interface DynamicMenuData {
  teams: {
    name: string;
    logo: MenuIcon;
    plan: string;
  }[];
  navMain: MenuItem[];
  projects: {
    name: string;
    url: string;
    icon: MenuIcon;
  }[];
}

// API响应类型
import { ApiResponse } from './roleTypes';

export interface RolesResponse extends ApiResponse<Role[]> {}
export interface MenuConfigResponse extends ApiResponse<RoleMenuConfig[]> {}