'use client';

import { PermissionProvider, UserRole } from "@/app/context/permission-context";
import StatusProductList from "../components/status-product-list";

interface PaginationData {
  total: number;
  page: number;
  page_size: number;
}

interface ProductStatusWrapperProps {
  products: any[];
  status: string;
  orgName: string;
  userRole: UserRole;
  pagination?: PaginationData;
  baseUrl?: string;
}

export default function ProductStatusWrapper({
  products,
  status,
  orgName,
  userRole,
  pagination,
  baseUrl
}: ProductStatusWrapperProps) {
  return (
    <PermissionProvider initialRole={userRole}>
      <StatusProductList
        products={products}
        status={status}
        orgName={orgName}
        pagination={pagination}
        baseUrl={baseUrl}
      />
    </PermissionProvider>
  );
} 