"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProviderOrderDetail from "@/app/workspace/components/orders/ProviderOrderDetails";
import MarketOrderDetails from "@/app/workspace/components/orders/MarketOrderDetails";
import OrderDetail from "@/app/workspace/components/orders/OrderDetails";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { TenantType } from "@/lib/types/orderStatus";

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
  
  const tenantType = organization?.tenantType;
  const orderCode = params.order_code as string;
  const marketId = params.market_id as string;
  if (tenantType === TenantType.PROVIDER || tenantType === "PROVIDER") {
    return (
      <ProviderOrderDetail
        orderCode={params.order_code as string}
        orgId={params.market_id as string}
      />
    );
  }

  if (tenantType === TenantType.MARKET || tenantType === "MARKET") {
    return (
      <MarketOrderDetails
        orderCode={params.order_code as string}
        orgId={params.market_id as string}
        userType="MARKET"
      />
    );
  }

  // 如果 tenantType 为空，或者匹配不到 PROVIDER/MARKET，
  // 我们默认使用 MarketOrderDetails，或者再次检查 market_id
  // 考虑到这是 markets 路径下的页面，如果没有明确的 tenantType，大概率是 MARKET 用户
  if (!tenantType) {
    console.warn('OrderDetailPage - tenantType is empty, defaulting to MarketOrderDetails for safety');
    return (
      <MarketOrderDetails
        orderCode={orderCode}
        orgId={marketId}
        userType="MARKET"
      />
    );
  }

  // Fallback to original component for CUSTOMER or others
  return (
    <OrderDetail
      orderCode={orderCode}
      orgId={marketId}
      tenantType={tenantType}
    />
  );
}
