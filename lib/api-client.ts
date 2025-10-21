import { Organization, Role, User } from "@/app/models";


export const handleApiError = (error: ApiError, toastFn: ToastFunction) => {
    const errorMessages: Record<number, { title: string; description: string }> = {
        400: {
            title: "请求错误",
            description: "请求数据错误",
        },
        401: {
            title: "签名失败",
            description: error.message,
        },
        403: {
            title: "权限不足",
            description: "您没有权限访问该资源",
        },
        404: {
            title: "登录失败",
            description: "用户名或密码错误",
        },
        409: {
            title: "注册失败",
            description: "用户或组织已存在",
        },
        500: {
            title: "服务器错误",
            description: "请稍后重试",
        },
    };

    const defaultError = {
        title: "请求失败",
        description: "远程服务器无响应，请稍后重试",
    };

    const errorMessage = errorMessages[error.status] || defaultError;

    toastFn({
        variant: "destructive",
        ...errorMessage,
    });
};

class ApiClient {
    private baseUrl: string;
    private token: string;

    constructor(token?: string) {
        this.baseUrl = `${process.env.BACKEND_API_URL}/api/v1`;
        this.token = token || '';
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit
    ): Promise<ApiResponse<T>> {
        const response = await fetch(`${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw {
                status: response.status,
                message: response.statusText
            };
        }
        return response.json();
    }

    // User login
    async login(username: string, password: string): Promise<ApiResponse<string>> {
        return this.request(`/login`, {
            method: 'POST',
            body: JSON.stringify({
                username: username.trim(),
                password: password.trim(),
            }),
        });
    }

    // User register
    async register(data: {
        tenantName: string;
        username: string;
        tenantType: string;
        password: string;
    }): Promise<ApiResponse<string>> {
        return this.request(`${this.baseUrl}/register`, {
            method: 'POST',
            body: JSON.stringify({
                tenant_name: data.tenantName.trim(),
                username: data.username.trim(),
                tenant_type: data.tenantType,
                password: data.password.trim(),
            }),
        });
    }

    // Get organization
    async getOrganization(
        username: string
    ): Promise<ApiResponse<Organization>> {
        console.log(`/users/${username}/tenants`);
        return this.request(`${this.baseUrl}/users/${username}/tenants`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
        });
    }

    // Update organization
    async updateOrganization(
        // username: string,
        orgId: string,
        data: Partial<Organization>
    ): Promise<ApiResponse<Organization>> {
        console.log(this.token);
        return this.request(`/tenants/${orgId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: JSON.stringify(data),
        });
    }

    async updateUser(
        username: string,
        data: Partial<User>,
        token: string
    ): Promise<ApiResponse<null>> {
        return this.request(`/users/${username}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
    }

    async getOrganizationUsers(
        tenant_hashed_name: string,
    ): Promise<ApiResponse<User[]>> {
        console.log(`/tenants/${tenant_hashed_name}/users`);
        return this.request(`/tenants/${tenant_hashed_name}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
        });
    }

    // TODO: not finished
    async createOrganizationUser(
        tenant_hash: string,
        data: {
            username: string;
            email: string;
            phone: string;
            password: string;
            roles: number[];
        }
    ): Promise<ApiResponse<User>> {
        return this.request(`/tenants/${tenant_hash}/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: JSON.stringify(data),
        });
    }

    async getRoles(tenant_hash: string, tenant_type: string, token: string): Promise<ApiResponse<Role[]>> {
        return this.request(`/tenants/${tenant_hash}/types/${tenant_type}/roles`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }
}

export { ApiClient };

type ApiResponse<T> = {
    code: number;
    data?: T;
    message?: string;
};

export type ApiError = {
    status: number;
    message: string;
};

interface ToastFunction {
    (props: {
      variant: 'default' | 'destructive';
      title: string;
      description: string;
    }): void;
  }
  