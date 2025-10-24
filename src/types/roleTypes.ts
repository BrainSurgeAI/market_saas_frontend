export interface Role {
  id: number;
  name: string;
  tenantType: string | null;
  aliasName: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  requestId: string;
  timestamp: string;
}

export interface RolesResponse extends ApiResponse<Role[]> {} 