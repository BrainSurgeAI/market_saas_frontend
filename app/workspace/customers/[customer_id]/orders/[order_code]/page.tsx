"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import OrderDetail from "@/app/workspace/components/orders/OrderDetails";
import CustomerOrderDetails from "@/app/workspace/components/orders/CustomerOrderDetails";
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function OrderDetailPage() {
  const params = useParams();  
  const { organization } = useWorkspace();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if organization is loaded
    if (organization) {
      setIsLoading(false);
    }
  }, [organization]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check tenant type to determine which component to render
  const tenantType = organization?.tenantType;
  const orderCode = params.order_code as string;
  const customerId = params.customer_id as string;

  // If tenantType is CUSTOMER, use the dedicated component
  // Also fallback to CustomerOrderDetails if tenantType is missing but we are in customer route
  if (tenantType === "CUSTOMER" || !tenantType) {
    return <CustomerOrderDetails orderCode={orderCode} orgId={customerId} />;
  }

  // Fallback to standard component (though this path should be for customers)
  return (
    <OrderDetail orderCode={orderCode} orgId={customerId} tenantType={tenantType} />
  );
}
