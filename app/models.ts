export interface Organization {
    id: number;
    name: string;
    address: string;
    phone: string;
    nameHash: string;
    licenseImage: string;
    tenantType: string;
    status: 'PENDING' | 'SUBMITTED' | 'ACTIVE' | 'REJECTED';
    createdAt: number;
    updatedAt: number;
    businessScope: string;
    verifiedAt: number;
    deletedAt?: number;
}

export interface User {
    id: string | null;
    name: string | null;
    username: string;
    email: string | null;
    phone: string | null;
    role: string;
    tenantId: number | null;
    tenantName: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

// Only organization admin can access this model 
// The organization type is 'MARKET' or 'PROVIDER'
export interface TenantCredit {
    id: number;
    tenant_id: number;
    credit_score: number | null;
    credit_limit: number | null;
    deposit_amount: number | null;
    payment_period_days: number | null;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
}

export interface Role {
    id: number;
    name: string;
    tenant_type: string | null;
    alias_name: string;
}


export interface TokenPayload {
    exp: number;
    permissions: string[];
    roles: string[];
    username: string;
    tenant_hash: string;
    tenant_name: string;
    is_super_admin: boolean;
}

export interface PriceStatus {
    category_id: number;
    category_name: string;
    total_products: number;
    products_without_price: number; // 未报价
    products_pending: number; // 待审核
    products_approved: number; // 已审核
    products_published: number; // 已发布
    products_rejected: number; // 已驳回
}

export interface DeliveryPerson {
    name: string
    idCard: string;
    phone: string;
    createdBy: string;
    createdAt: string;
    status: number;
  }