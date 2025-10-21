import { ApiResponse } from './roleTypes';

// 权限定义
export interface Permission {
  id: number;
  name: string;        // 权限标识符，如 CREATE_USER
  cname: string;   // 权限显示名称，如"创建用户"
  description: string; // 权限描述
  resource?: string;    // 资源类型，如 USER, ROLE, ORDER等
  action?: string;      // 操作类型，如 CREATE, READ, UPDATE, DELETE
  module?: string;      // 所属模块
}

// 权限组/分类
export interface PermissionGroup {
  module: string;     // 模块名称
  permissions: Permission[]; // 该模块下的权限列表
}

// 角色-权限关联
export interface RolePermission {
  roleId: number;
  permissionId: number;
}

// 分页返回的权限列表
export interface PermissionPagination {
  items: Permission[];
  total: number;
  page: number;
  pageSize: number;
}

// 返回的权限列表（按模块分组）
export interface GroupedPermissions {
  [module: string]: Permission[];
}

// API响应类型
export interface PermissionsResponse extends ApiResponse<Permission[]> {}
export interface GroupedPermissionsResponse extends ApiResponse<GroupedPermissions> {}
export interface RolePermissionsResponse extends ApiResponse<number[]> {} // 返回权限ID数组 