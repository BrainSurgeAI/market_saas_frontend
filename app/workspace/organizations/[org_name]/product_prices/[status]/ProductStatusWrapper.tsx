'use client';

import { PermissionProvider, UserRole } from "@/app/context/permission-context";
import StatusProductList from "../components/status-product-list";

interface ProductStatusWrapperProps {
  products: any[];
  status: string;
  orgName: string;
  userRole: UserRole;
}

export default function ProductStatusWrapper({ products, status, orgName, userRole }: ProductStatusWrapperProps) {
  return (
    <PermissionProvider initialRole={userRole}>
      <StatusProductList 
        products={products} 
        status={status} 
        orgName={orgName}
      />
    </PermissionProvider>
  );
} 