"use client";

import { useParams } from "next/navigation";
import OrderDetail from "@/app/workspace/components/orders/OrderDetails";
import { useWorkspace } from "@/lib/WorkspaceContext";


export default function OrderDetailPage() {
  const params = useParams();  
  const { organization } = useWorkspace();
  return (
    <OrderDetail orderCode={params.order_code as string} orgId={params.market_id as string} tenantType={organization.tenantType} />
  );
} 