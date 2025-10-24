import { ApiResponse } from './roleTypes';

// 权限定义
export interface Permission {
  id: number;
  name: string;        // 权限标识符，如 CREATE_USER
  cname: string | null;   // 权限显示名称，如"创建用户"
  description: string | null; // 权限描述
  httpMethod?: string; // 关联的HTTP方法，如 GET, POST, PUT, DELETE
  pathPattern?: string;   // 关联的HTTP路径，如 /api/users
  selfOnly?: number;   // 是否仅限自己：1表示是，0表示否
}

// 权限组/分类
export interface PermissionGroup {
  category: string;     // 分类名称（如HTTP方法）
  permissions: Permission[]; // 该分类下的权限列表
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

// 返回的权限列表（按分类分组）
export interface GroupedPermissions {
  [category: string]: Permission[];
}

// API响应类型
export interface PermissionsResponse extends ApiResponse<Permission[]> {}
export interface GroupedPermissionsResponse extends ApiResponse<GroupedPermissions> {}
export interface RolePermissionsResponse extends ApiResponse<number[]> {} // 返回权限ID数组 